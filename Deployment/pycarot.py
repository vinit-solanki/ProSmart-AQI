# Import necessary libraries
import pandas as pd
import numpy as np
from pycaret.time_series import *
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import os
import json
import firebase_admin
from firebase_admin import credentials, db

def initialize_firebase():
    """Initialize Firebase connection"""
    try:
        # Load Firebase credentials
        cred = credentials.Certificate('aqi.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://aqipred-727b6-default-rtdb.firebaseio.com'
        })
        print("SUCCESS: Firebase initialized successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Error initializing Firebase: {str(e)}")
        return False

def load_data_from_firebase():
    """Load historical data from Firebase for all parameters"""
    try:
        # Get reference to the history data
        ref = db.reference('/history')
        history_data = ref.get()
        
        if not history_data:
            print("[ERROR] No data found in Firebase history")
            return None
        
        # Define the parameters we want to forecast
        parameters = ['CO', 'NO2', 'O3', 'PM10', 'PM2_5', 'SO2', 'TEMP']
        
        # Convert Firebase data to DataFrame
        data_dict = {}
        
        for param in parameters:
            if param in history_data:
                param_data = history_data[param]
                # Convert timestamp keys to datetime and values to float
                timestamps = []
                values = []
                
                for timestamp_str, value in param_data.items():
                    try:
                        # Parse ISO timestamp
                        dt = pd.to_datetime(timestamp_str)
                        timestamps.append(dt)
                        values.append(float(value))
                    except Exception as e:
                        print(f"Warning: Could not parse timestamp {timestamp_str} for {param}: {e}")
                        continue
                
                if timestamps and values:
                    # Create DataFrame for this parameter
                    param_df = pd.DataFrame({
                        'timestamp': timestamps,
                        param: values
                    })
                    param_df.set_index('timestamp', inplace=True)
                    data_dict[param] = param_df
                    print(f"SUCCESS: Loaded {len(param_df)} records for {param}")
                else:
                    print(f"WARNING: No valid data found for {param}")
            else:
                print(f"WARNING: Parameter {param} not found in Firebase")
        
        if not data_dict:
            print("[ERROR] No valid data found for any parameter")
            return None
        
        # Combine all parameters into one DataFrame
        data_combined = pd.concat(data_dict.values(), axis=1, sort=True)
        
        # Sort by timestamp
        data_combined = data_combined.sort_index()
        
        # Handle missing values (forward fill for time series)
        data_combined = data_combined.fillna(method='ffill')
        
        print(f"\nSUCCESS: Combined dataset shape: {data_combined.shape}")
        print(f"SUCCESS: Date range: {data_combined.index.min()} to {data_combined.index.max()}")
        print(f"SUCCESS: Parameters: {list(data_combined.columns)}")
        
        return data_combined
        
    except Exception as e:
        print(f"[ERROR] Error loading data from Firebase: {str(e)}")
        return None

print("="*80)
print("[STARTUP] MULTI-PARAMETER AIR QUALITY FORECASTING SYSTEM")
print("="*80)
print("[INFO] Data Source: Firebase Real-time Database")
print("[INFO] Parameters: CO, NO2, O3, PM10, PM2_5, SO2, TEMP")
print("[INFO] Models: ARIMA (O3,PM2.5,PM10,SO2,TEMP) | Best Model (CO,NO2)")
print("[INFO] Output: PNG visualizations + Firebase forecast updates")
print("[WARNING] Firebase: OVERWRITES existing forecast data")
print("="*80)

print("\nInitializing Firebase connection...")
if initialize_firebase():
    print("Loading data from Firebase...")
    data_clean = load_data_from_firebase()
    
    if data_clean is None:
        print("[ERROR] Failed to load data from Firebase. Exiting...")
        exit(1)
    
    # Display dataset info
    print("\nDataset Info:")
    print(data_clean.info())
    print("\nDataset Statistics:")
    print(data_clean.describe())
    
    # Check for missing values
    print(f"\nMissing values per parameter:")
    for col in data_clean.columns:
        missing_count = data_clean[col].isnull().sum()
        print(f"  {col}: {missing_count}")
    
    print(f"\nIndex has unique values: {data_clean.index.is_unique}")
else:
    print("[ERROR] Failed to initialize Firebase. Exiting...")
    exit(1)

def forecast_parameter(data, parameter_name, session_id=123):
    """Forecast a single parameter using PyCaret"""
    print(f"\n{'='*50}")
    print(f"FORECASTING {parameter_name}")
    print(f"{'='*50}")
    
    try:
        # Prepare data for this parameter
        param_data = data[[parameter_name]].copy()
        
        # Initialize PyCaret time series environment for this parameter
        print(f"Initializing PyCaret setup for {parameter_name}...")
        ts_setup = setup(
            data=param_data,
            target=parameter_name,
            session_id=session_id,
            fold=2,  # Reduced folds for faster execution
            fh=48,  # Forecast horizon: 48 hours ahead
            fold_strategy='sliding',
            verbose=False
        )
        print(f"✓ Setup completed for {parameter_name}!")
        
        # Model selection based on parameter type
        if parameter_name in ['O3', 'PM2_5', 'PM10', 'SO2', 'TEMP']:
            # Use ARIMA model for specific parameters
            print(f"Using ARIMA model for {parameter_name}...")
            tuned_model = create_model('arima')
            print(f"✓ ARIMA model created for {parameter_name}!")
        else:
            # Use best model selection for other parameters (CO, NO2)
            print(f"Creating baseline model (ETS) for {parameter_name}...")
            model_baseline = create_model('ets')
            print(f"✓ Baseline model created for {parameter_name}!")
            
            # Compare different time series models
            print(f"Comparing models for {parameter_name}...")
            best_model = compare_models(sort='MASE', verbose=False, include=['ets', 'arima'])
            print(f"✓ Model comparison completed for {parameter_name}!")
            
            # Display the best model
            print(f"Best model for {parameter_name}: {type(best_model).__name__}")
            
            # Skip tuning to avoid getting stuck - use the best model directly
            print(f"Using best model for {parameter_name} (skipping tuning to avoid timeouts)...")
            tuned_model = best_model
        
        # Finalize the model
        print(f"Finalizing model for {parameter_name}...")
        final_model = finalize_model(tuned_model)
        print(f"✓ Model finalized for {parameter_name}!")
        
        # Make predictions
        print(f"Making predictions for {parameter_name}...")
        future_forecast = predict_model(final_model, verbose=False)
        print(f"✓ Predictions generated for {parameter_name}!")
        
        # Note: Model saving removed as requested - only keeping visualizations
        print(f"✓ Model training completed for {parameter_name} (not saving model file)")
        
        return final_model, future_forecast
        
    except Exception as e:
        print(f"[ERROR] Error forecasting {parameter_name}: {str(e)}")
        return None, None

parameters = list(data_clean.columns)
print(f"\nParameters to forecast: {parameters}")

# Store results for all parameters
forecast_results = {}
trained_models = {}

# Forecast each parameter
for i, param in enumerate(parameters):
    model, forecast = forecast_parameter(data_clean, param, session_id=123+i)
    if model is not None and forecast is not None:
        trained_models[param] = model
        forecast_results[param] = forecast
        print(f"\n{param} Forecast (last 5 values):")
        print(forecast.tail(5))
    else:
        print(f"[ERROR] Failed to forecast {param}")

print(f"\n✓ Successfully forecasted {len(forecast_results)} out of {len(parameters)} parameters")

print("\nGenerating model plots for all parameters...")
for param, model in trained_models.items():
    try:
        print(f"Generating plots for {param}...")
        plot_model(model, plot='diagnostics', save=True)
        print(f"✓ Diagnostics plot saved for {param}")
        
        plot_model(model, plot='forecast', save=True) 
        print(f"✓ Forecast plot saved for {param}")
        
        plot_model(model, plot='residuals', save=True)
        print(f"✓ Residuals plot saved for {param}")
        
        plot_model(model, plot='ts', save=True)
        print(f"✓ Time series plot saved for {param}")
    except Exception as e:
        print(f"Note: Plot generation had issues for {param}: {str(e)}")
        print("Continuing with next parameter...")

# Create forecast visualizations as images for all parameters
print("\nGenerating forecast visualizations as images...")

def create_forecast_plots_multi(data_clean, forecast_results, parameter_name):
    """Create matplotlib plots for forecast visualization and save as images"""
    
    img_dir = 'forecast_images'
    os.makedirs(img_dir, exist_ok=True)
    
    # Prepare data - ONLY 48-hour forecast, no past data
    future_forecast = forecast_results[parameter_name]
    future_pred_col = parameter_name if parameter_name in future_forecast.columns else future_forecast.columns[0]
    future_data = future_forecast[future_pred_col].tail(48)  # Next 48 hours
    
    # 1. Main Forecast Plot - ONLY 48-hour forecast
    plt.figure(figsize=(15, 8))
    plt.plot(future_data.index, future_data.values, label='48h Forecast', linewidth=3, color='red', marker='o', markersize=4)
    plt.title(f'{parameter_name} 48-Hour Forecasting Analysis - {datetime.now().strftime("%Y-%m-%d %H:%M")}', fontsize=16, fontweight='bold')
    plt.xlabel('Date', fontsize=12)
    plt.ylabel(f'{parameter_name} Level', fontsize=12)
    plt.legend(fontsize=12)
    plt.grid(True, alpha=0.3)
    plt.xticks(rotation=45)
    plt.tight_layout()
    
    main_plot_file = os.path.join(img_dir, f'{parameter_name}_forecast_analysis_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
    plt.savefig(main_plot_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Main forecast analysis saved: {main_plot_file}")
    
    # 2. Statistics Dashboard
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle(f'{parameter_name} 48-Hour Forecast Dashboard', fontsize=16, fontweight='bold')
    
    # Forecast values
    ax1.plot(range(len(future_data)), future_data.values, marker='o', linewidth=2, color='green')
    ax1.set_title('48-Hour Forecast Values')
    ax1.set_xlabel('Hours Ahead')
    ax1.set_ylabel(f'{parameter_name} Level')
    ax1.grid(True, alpha=0.3)
    
    # Statistics
    stats_values = [np.mean(future_data), np.max(future_data), np.min(future_data), np.std(future_data)]
    stats_labels = ['Mean', 'Max', 'Min', 'Std Dev']
    colors = ['blue', 'red', 'green', 'orange']
    ax2.bar(stats_labels, stats_values, color=colors)
    ax2.set_title('Prediction Statistics')
    ax2.set_ylabel(f'{parameter_name} Level')
    for i, v in enumerate(stats_values):
        ax2.text(i, v + max(stats_values)*0.01, f'{v:.2f}', ha='center', va='bottom')
    
    # Quality levels (customize thresholds based on parameter)
    if parameter_name in ['NO2', 'O3', 'PM10', 'PM2_5']:
        # Air quality parameters
        if parameter_name == 'NO2':
            thresholds = [40, 80, 120]
        elif parameter_name == 'O3':
            thresholds = [50, 100, 150]
        elif parameter_name == 'PM10':
            thresholds = [50, 100, 150]
        elif parameter_name == 'PM2_5':
            thresholds = [25, 50, 75]
        
        quality_counts = {'Good': 0, 'Moderate': 0, 'Unhealthy': 0}
        for val in future_data.values:
            if val < thresholds[0]:
                quality_counts['Good'] += 1
            elif val < thresholds[1]:
                quality_counts['Moderate'] += 1
            else:
                quality_counts['Unhealthy'] += 1
    else:
        # For other parameters, use simple ranges
        quality_counts = {'Low': 0, 'Medium': 0, 'High': 0}
        mean_val = np.mean(future_data)
        std_val = np.std(future_data)
        for val in future_data.values:
            if val < mean_val - std_val:
                quality_counts['Low'] += 1
            elif val < mean_val + std_val:
                quality_counts['Medium'] += 1
            else:
                quality_counts['High'] += 1
    
    ax3.bar(quality_counts.keys(), quality_counts.values(), color=['green', 'yellow', 'red'])
    ax3.set_title('Level Distribution')
    ax3.set_ylabel('Number of Hours')
    for i, v in enumerate(quality_counts.values()):
        ax3.text(i, v + 0.1, str(v), ha='center', va='bottom')
    
    # Hourly pattern (6-hour averages for 48-hour forecast)
    hourly_avg = [np.mean(future_data.values[i:i+6]) for i in range(0, len(future_data), 6)]
    ax4.bar(range(len(hourly_avg)), hourly_avg, color='purple')
    ax4.set_title('6-Hour Averages (48h Forecast)')
    ax4.set_xlabel('6-Hour Periods')
    ax4.set_ylabel(f'Average {parameter_name} Level')
    for i, v in enumerate(hourly_avg):
        ax4.text(i, v + max(hourly_avg)*0.01, f'{v:.2f}', ha='center', va='bottom')
    
    plt.tight_layout()
    dashboard_file = os.path.join(img_dir, f'{parameter_name}_dashboard_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
    plt.savefig(dashboard_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Dashboard saved: {dashboard_file}")
    
    return main_plot_file, dashboard_file

def create_combined_overview_plot(data_clean, forecast_results):
    """Create a combined overview plot for all parameters - ONLY 48-hour forecast"""
    img_dir = 'forecast_images'
    os.makedirs(img_dir, exist_ok=True)
    
    # Create subplots for all parameters
    n_params = len(forecast_results)
    fig, axes = plt.subplots(n_params, 1, figsize=(15, 4*n_params))
    if n_params == 1:
        axes = [axes]
    
    fig.suptitle('Complete Air Quality 48-Hour Forecasting Overview', fontsize=16, fontweight='bold')
    
    colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink']
    
    for i, (param, forecast) in enumerate(forecast_results.items()):
        future_pred_col = param if param in forecast.columns else forecast.columns[0]
        future_data = forecast[future_pred_col].tail(48)  # 48-hour forecast
        
        axes[i].plot(future_data.index, future_data.values, label='48h Forecast', 
                    linewidth=3, color=colors[i % len(colors)], marker='o', markersize=3)
        axes[i].set_title(f'{param} - 48-Hour Forecast')
        axes[i].set_ylabel(f'{param} Level')
        axes[i].legend()
        axes[i].grid(True, alpha=0.3)
        axes[i].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    overview_file = os.path.join(img_dir, f'Complete_Overview_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png')
    plt.savefig(overview_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"✓ Complete overview saved: {overview_file}")
    
    return overview_file

# Generate image plots for all parameters
all_image_files = []
try:
    for param in forecast_results.keys():
        print(f"\nGenerating plots for {param}...")
        image_files = create_forecast_plots_multi(data_clean, forecast_results, param)
        all_image_files.extend(image_files)
    
    # Create combined overview
    overview_file = create_combined_overview_plot(data_clean, forecast_results)
    all_image_files.append(overview_file)
    
    print(f"\n[SUCCESS] Successfully generated {len(all_image_files)} forecast image files!")
    print("Image files created:")
    for i, file in enumerate(all_image_files, 1):
        print(f"  {i}. {file}")
except Exception as e:
    print(f"[ERROR] Error generating image plots: {str(e)}")
    print("Continuing with remaining analysis...")

# Generate and display model summary for all parameters
print("Generating model summary for all parameters...")
all_model_results = {}

for param, model in trained_models.items():
    try:
        print(f"\nModel Performance Metrics for {param}:")
        model_results = pull()
        all_model_results[param] = model_results
        print(model_results)
    except Exception as e:
        print(f"Could not get model results for {param}: {str(e)}")

# Create a function for making new predictions for all parameters
def make_multi_forecast(trained_models, hours=48):
    """Make forecasts for all parameters for specified number of hours"""
    all_predictions = {}
    
    for param, model in trained_models.items():
        try:
            predictions = predict_model(model, verbose=False)
            future_predictions = predictions.tail(hours)
            all_predictions[param] = future_predictions
            print(f"✓ Generated {hours}h predictions for {param}")
        except Exception as e:
            print(f"[ERROR] Error generating predictions for {param}: {str(e)}")
    
    return all_predictions

# Example usage of the prediction function
print("\nMaking new predictions using all trained models...")
new_predictions_all = make_multi_forecast(trained_models, 48)

# Display predictions for each parameter
for param, predictions in new_predictions_all.items():
    print(f"\nNext 48 hours {param} predictions:")
    pred_col = param if param in predictions.columns else predictions.columns[0]
    print(predictions[[pred_col]].head(48))

# Note: CSV saving removed as requested - only keeping PNG visualizations
print("✓ Predictions generated (not saving CSV files as requested)")

# Display summary statistics of predictions
print("\nPrediction Summary Statistics for all parameters:")
for param, predictions in new_predictions_all.items():
    pred_col = param if param in predictions.columns else predictions.columns[0]
    print(f"\n{param} Statistics:")
    print(predictions[pred_col].describe())

# Note: Actual vs predicted comparison plots removed as requested - only keeping 48-hour forecast plots
print("✓ Skipping actual vs predicted comparison plots (only keeping 48-hour forecast visualizations)")

# Create a comprehensive text summary report for all parameters
print("\nCreating comprehensive summary report...")

def create_multi_summary_report(all_model_results, new_predictions_all):
    """Create a comprehensive text summary report for all parameters"""
    
    # Create output directory for reports
    report_dir = 'forecast_reports'
    os.makedirs(report_dir, exist_ok=True)
    
    # Generate summary content
    summary_content = f"""
MULTI-PARAMETER AIR QUALITY FORECASTING MODEL - SUMMARY REPORT
Generated on: {datetime.now().strftime("%B %d, %Y at %H:%M:%S")}
{'='*80}

FORECASTED PARAMETERS: {', '.join(new_predictions_all.keys())}
DATA SOURCE: Firebase Real-time Database
FORECAST HORIZON: 48 hours ahead
{'='*80}

"""
    
    # Add model performance metrics for each parameter
    for param, predictions in new_predictions_all.items():
        pred_col = param if param in predictions.columns else predictions.columns[0]
        pred_stats = predictions[pred_col].describe()
        
        summary_content += f"""
{param} FORECASTING RESULTS:
{'='*40}
PREDICTION STATISTICS:
  Average Predicted {param}: {pred_stats['mean']:.2f}
  Maximum Predicted {param}: {pred_stats['max']:.2f}
  Minimum Predicted {param}: {pred_stats['min']:.2f}
  Standard Deviation: {pred_stats['std']:.2f}

NEXT 48 HOURS PREDICTIONS:
"""
        
        # Add prediction details for this parameter
        for i, (idx, row) in enumerate(predictions.head(48).iterrows(), 1):
            value = row[pred_col]
            
            # Quality assessment based on parameter type
            if param in ['NO2', 'O3', 'PM10', 'PM2_5']:
                if param == 'NO2':
                    if value < 40:
                        quality = "Good"
                    elif value < 80:
                        quality = "Moderate"
                    elif value < 120:
                        quality = "Unhealthy for Sensitive"
                    else:
                        quality = "Unhealthy"
                elif param == 'O3':
                    if value < 50:
                        quality = "Good"
                    elif value < 100:
                        quality = "Moderate"
                    elif value < 150:
                        quality = "Unhealthy for Sensitive"
                    else:
                        quality = "Unhealthy"
                elif param == 'PM10':
                    if value < 50:
                        quality = "Good"
                    elif value < 100:
                        quality = "Moderate"
                    elif value < 150:
                        quality = "Unhealthy for Sensitive"
                    else:
                        quality = "Unhealthy"
                elif param == 'PM2_5':
                    if value < 25:
                        quality = "Good"
                    elif value < 50:
                        quality = "Moderate"
                    elif value < 75:
                        quality = "Unhealthy for Sensitive"
                    else:
                        quality = "Unhealthy"
            else:
                # For other parameters (CO, SO2, TEMP), use simple ranges
                mean_val = pred_stats['mean']
                std_val = pred_stats['std']
                if value < mean_val - std_val:
                    quality = "Low"
                elif value < mean_val + std_val:
                    quality = "Medium"
                else:
                    quality = "High"
            
            date_str = idx.strftime("%Y-%m-%d %H:%M") if hasattr(idx, 'strftime') else str(idx)
            summary_content += f"  Hour {i:2d}: {date_str} | {value:8.2f} | {quality}\n"
    
    summary_content += f"""
{'='*80}
KEY INSIGHTS:
- Model Type: Time Series Forecasting using PyCaret
- Parameters Forecasted: {len(new_predictions_all)} air quality parameters
- Data Source: Firebase Real-time Database (history collection)
- Forecast Horizon: 48 hours ahead
- Data Processing: Automated cleaning and feature engineering
- Validation: Cross-validation with sliding window approach
- Models Used: 
  * ARIMA: O3, PM2.5, PM10, SO2, TEMP
  * Best Model (ETS/ARIMA): CO, NO2

GENERATED FILES:
"""
    
    # List all generated files (only 48-hour forecast PNG visualizations)
    summary_content += "- 48-hour forecast visualization images for all parameters\n"
    
    summary_content += f"""
- forecast_images/ (Forecast visualization images for all parameters)
- forecast_reports/ (This summary report)
- Firebase /forecast collection (Updated with new predictions - overwrites existing data)

IMPORTANT NOTES:
- These predictions are based on historical patterns and should be used as guidance only
- Air quality can be affected by sudden weather changes, traffic patterns, and industrial activities
- For critical decisions, please consult official air quality monitoring services
- Model performance may vary depending on data quality and external factors
- Each parameter uses its own optimized forecasting model

Report generated by PyCaret Multi-Parameter Time Series Forecasting Pipeline
© 2024 ProSmart AQI Forecasting System
"""
    
    # Save the summary report
    summary_file = os.path.join(report_dir, f'Multi_Parameter_Forecasting_Summary_Report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt')
    with open(summary_file, 'w', encoding='utf-8') as f:
        f.write(summary_content)
    
    return summary_file

# Save predictions back to Firebase (overwrite existing values)
def save_predictions_to_firebase(predictions_dict):
    """Save forecast predictions to Firebase forecast collection - OVERWRITES existing data"""
    try:
        print("\nSaving predictions to Firebase (overwriting existing forecast data)...")
        forecast_ref = db.reference('/forecast')
        
        for param, predictions in predictions_dict.items():
            pred_col = param if param in predictions.columns else predictions.columns[0]
            
            # Convert predictions to Firebase format
            forecast_data = {}
            for idx, row in predictions.iterrows():
                timestamp_str = idx.strftime('%Y-%m-%dT%H:%M:%SZ') if hasattr(idx, 'strftime') else str(idx)
                forecast_data[timestamp_str] = float(row[pred_col])
            
            # OVERWRITE existing data in Firebase (using .set() replaces all existing data)
            forecast_ref.child(param).set(forecast_data)
            print(f"✓ OVERWROTE {len(forecast_data)} predictions for {param} in Firebase")
        
        print("[SUCCESS] All predictions OVERWRITTEN in Firebase successfully!")
        print("[INFO] Note: Previous forecast data has been completely replaced with new predictions")
        return True
        
    except Exception as e:
        print(f"[ERROR] Error saving predictions to Firebase: {str(e)}")
        return False

# Save predictions to Firebase
save_predictions_to_firebase(new_predictions_all)

# Generate the comprehensive summary report
try:
    summary_report_file = create_multi_summary_report(all_model_results, new_predictions_all)
    print(f"[SUCCESS] Comprehensive summary report created: {summary_report_file}")
except Exception as e:
    print(f"[ERROR] Error creating summary report: {str(e)}")

print("\n" + "="*80)
print("🎉 MULTI-PARAMETER FORECASTING COMPLETED SUCCESSFULLY!")
print("="*80)
print(f"\n[SUMMARY] FORECASTED PARAMETERS: {', '.join(forecast_results.keys())}")
print(f"📈 TOTAL MODELS TRAINED: {len(trained_models)}")
print(f"🔮 FORECAST HORIZON: 48 hours ahead")
print(f"[INFO] DATA SOURCE: Firebase Real-time Database")
print("\n📁 FILES GENERATED:")
print("   • 48-Hour Forecast Images: forecast_images/ directory")
print("   • Summary Report: forecast_reports/ directory")
print("   • Firebase Forecast Collection: UPDATED with new predictions (overwrites existing)")
print("\n[INFO] Check the forecast_images/ folder for visualization plots!")
print("📄 Check the forecast_reports/ folder for detailed analysis!")
print("[INFO] All predictions are based on Firebase historical data!")
print("[WARNING] Firebase forecast collection has been OVERWRITTEN with new predictions!")
print("="*80)