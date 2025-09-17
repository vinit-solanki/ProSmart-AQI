import numpy as np
import pandas as pd
import requests
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
import json
from statsmodels.tsa.arima.model import ARIMA as StatsARIMA

class ARIMA:
    def __init__(self, p=1, d=1, q=1):
        self.p = p  # autoregressive order
        self.d = d  # differencing order
        self.q = q  # moving average order
        self.ar_params = None
        self.ma_params = None
        self.diff_series = None
        self.residuals = None
        self.mean = None
        self.orig_series = None
    
    def difference(self, series, d=1):
        result = series.copy()
        for _ in range(d):
            result = np.diff(result)
        return result
    
    def estimate_ar_params(self, series):
        if self.p == 0:
            return np.array([])
            
        n = len(series)
        
        # bias correction (referred from statsmodel arima)
        acf = np.zeros(self.p + 1)
        mean = np.mean(series)
        series_centered = series - mean
        
        denom = n

        for lag in range(self.p + 1):
            if lag < n:
                # full sample size for deno
                acf[lag] = np.sum(series_centered[lag:] * series_centered[:n-lag]) / (denom * np.var(series))
        
        # yule-walker matrix
        R = np.zeros((self.p, self.p))
        for i in range(self.p):
            for j in range(self.p):
                R[i, j] = acf[abs(i - j)]
        
        r = acf[1:self.p+1]
        
        try:
            # add small constant diagonal for stability
            R = R + np.eye(self.p) * 1e-10
            ar_params = np.linalg.solve(R, r)
        except np.linalg.LinAlgError:
            # ridge regression instead of plain lstsq (ex lstsq)
            alpha = 1e-3  # ridge param
            ar_params = np.linalg.solve(R + alpha * np.eye(self.p), r)
        
        return ar_params
    
    def calculate_residuals(self, series):
        if self.p == 0:
            return series - self.mean
            
        n = len(series)
        residuals = np.zeros(n)
        
        residuals[:self.p] = 0
        
        for t in range(self.p, n):
            # ar pred
            prediction = self.mean
            for i in range(self.p):
                prediction += self.ar_params[i] * (series[t-i-1] - self.mean)
            
            residuals[t] = series[t] - prediction
        
        return residuals
    
    def estimate_ma_params(self, residuals):
        if self.q == 0:
            return np.array([])
            
        n = len(residuals)
        resid_std = np.std(residuals)
        
        # initialize ma param
        theta = np.zeros(self.q)
        
        # innovation algorithm iterations
        n_iter = 5
        for _ in range(n_iter):
            # implied autocovariances
            acf = np.zeros(self.q + 1)
            acf[0] = resid_std**2
            
            for i in range(1, self.q + 1):
                sum_term = np.sum([theta[j] * theta[j-i] for j in range(i, self.q)])
                acf[i] = -theta[i-1] * resid_std**2 + sum_term
            
            # update ma params
            for i in range(self.q):
                theta[i] = -acf[i+1] / acf[0]
        
        return theta
    
    def fit(self, series):
        self.orig_series = series.copy()
        self.diff_series = self.difference(series, self.d)
        self.mean = np.mean(self.diff_series)
        self.ar_params = self.estimate_ar_params(self.diff_series)
        self.residuals = self.calculate_residuals(self.diff_series)
        self.ma_params = self.estimate_ma_params(self.residuals)
        
        return self
    
    def forecast_diff(self, steps):
        # get last p
        diff_history = list(self.diff_series[-self.p:]) if self.p > 0 else []
        # get last q
        resid_history = list(self.residuals[-self.q:]) if self.q > 0 else []
        
        forecasts = []
        
        for _ in range(steps):
            forecast = self.mean
            
            # ar with centering
            for i in range(min(len(diff_history), self.p)):
                forecast += self.ar_params[i] * (diff_history[-i-1] - self.mean)
            
            # ma with scaling
            for i in range(min(len(resid_history), self.q)):
                forecast += self.ma_params[i] * resid_history[-i-1]
            
            forecasts.append(forecast)
            
            if self.p > 0:
                diff_history.append(forecast)
            if self.q > 0:
                resid_history.append(0)
        
        return np.array(forecasts)
    
    def invert_difference(self, diff_forecasts):
        if self.d == 0:
            return diff_forecasts
        
        last_values = self.orig_series[-self.d:]
        forecasts = diff_forecasts.copy()
        
        # level of differencing
        for i in range(self.d):
            # get appropriate seed
            last_value = last_values[-(i+1)]
            
            # integrate by cum sum
            forecasts = np.cumsum(np.insert(forecasts, 0, last_value))[1:]
        
        return forecasts
    
    def forecast(self, steps):
        # gen forecast for differenced series
        diff_forecasts = self.forecast_diff(steps)
        
        # handle initial conditions for integration
        forecasts = self.invert_difference(diff_forecasts)

        return forecasts
    
    def evaluate(self, actual, predicted):
        n = min(len(actual), len(predicted))
        
        if n == 0:
            return {"error": "No data for evaluation"}
        
        mse = np.mean((actual[:n] - predicted[:n]) ** 2)
        rmse = np.sqrt(mse)
        mae = np.mean(np.abs(actual[:n] - predicted[:n]))
        
        # mape (to handle zero values)
        non_zero = (actual[:n] != 0)
        if np.any(non_zero):
            mape = np.mean(np.abs((actual[:n][non_zero] - predicted[:n][non_zero]) / actual[:n][non_zero])) * 100
        else:
            mape = float('inf')
        
        return {
            "MSE": mse,
            "RMSE": rmse,
            "MAE": mae,
            "MAPE": mape,
            "n": n
        }

def get_pm25_data_from_api(station_id, start_date, end_date):
    url = "http://air4thai.com/forweb/getHistoryData.php"
    
    params = {
        "stationID": station_id,
        "param": "PM25",
        "type": "hr",
        "sdate": start_date,
        "edate": end_date,
        "stime": "00",
        "etime": "23"
    }
    
    try:
        response = requests.get(url, params=params)
        data = response.json()
        
        pm25_values = []
        timestamps = []
        
        for item in data['stations'][0]['data']:
            if item['PM25'] is not None:  # skip null values
                pm25_values.append(item['PM25'])
                timestamps.append(item['DATETIMEDATA'])
        
        return np.array(pm25_values), timestamps
    except Exception as e:
        print(f"Error fetching data from API: {str(e)}")
        return np.array([]), []

def plot_pm25_data(pm25_values, timestamps, title="PM2.5 Levels"):
    plt.figure(figsize=(12, 6))
    
    times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in timestamps]
    
    plt.plot(times, pm25_values)
    plt.title(title)
    plt.xlabel('Time')
    plt.ylabel('PM2.5 (μg/m³)')
    plt.grid(True)
    plt.gcf().autofmt_xdate()  # format dates on x-axis
    plt.tight_layout()
    
    return plt

def plot_test_vs_predicted(test_data, predictions, test_timestamps, title="Test vs Predicted PM2.5 Values"):
    """Plot test data against predictions to visualize model accuracy"""
    plt.figure(figsize=(12, 6))
    
    test_times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in test_timestamps]
    
    plt.plot(test_times, test_data, 'b-', label='Actual Test Data')
    plt.plot(test_times[:len(predictions)], predictions, 'r--', label='Model Predictions')
    
    plt.fill_between(test_times[:len(predictions)], test_data[:len(predictions)], predictions, 
                    where=(predictions > test_data[:len(predictions)]), 
                    facecolor='red', alpha=0.3, interpolate=True, label='Over-prediction')
    plt.fill_between(test_times[:len(predictions)], test_data[:len(predictions)], predictions, 
                    where=(predictions <= test_data[:len(predictions)]), 
                    facecolor='blue', alpha=0.3, interpolate=True, label='Under-prediction')
    
    plt.title(title)
    plt.xlabel('Time')
    plt.ylabel('PM2.5 (μg/m³)')
    plt.legend()
    plt.grid(True)
    plt.gcf().autofmt_xdate()
    plt.tight_layout()
    
    return plt

def plot_error_analysis(test_data, predictions, test_timestamps):
    """Create error analysis plots"""
    plt.figure(figsize=(12, 10))
    
    test_times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in test_timestamps[:len(predictions)]]
    errors = test_data[:len(predictions)] - predictions

    plt.subplot(2, 1, 1)
    plt.plot(test_times, errors, 'g-')
    plt.axhline(y=0, color='r', linestyle='-')
    plt.title('Error Over Time (Actual - Predicted)')
    plt.xlabel('Time')
    plt.ylabel('Error (μg/m³)')
    plt.grid(True)
    plt.gcf().autofmt_xdate()
    
    plt.subplot(2, 1, 2)
    plt.hist(errors, bins=20, alpha=0.7, color='green')
    plt.axvline(x=0, color='r', linestyle='-')
    plt.axvline(x=np.mean(errors), color='b', linestyle='--', label=f'Mean Error: {np.mean(errors):.2f}')
    plt.title('Error Distribution')
    plt.xlabel('Error (μg/m³)')
    plt.ylabel('Frequency')
    plt.grid(True)
    plt.legend()
    
    plt.tight_layout()
    return plt

def forecast_pm25(pm25_values, timestamps, forecast_hours=24, p=2, d=1, q=1):
    """
    arg:
        pm25_values (array): historical pm25 val
        timestamps (list): corresp. timestamps
        forecast_hours (int): num of hrs
        p, d, q (int): arima params
    
    ret:
        tuple: (forecasts, forecast_timestamps)
    """
    # fit arima
    model = ARIMA(p=p, d=d, q=q)
    model.fit(pm25_values)
    
    forecasts = model.forecast(forecast_hours)

    # gen future time    
    last_time = datetime.strptime(timestamps[-1], '%Y-%m-%d %H:%M:%S')
    future_times = [last_time + timedelta(hours=i+1) for i in range(forecast_hours)]
    forecast_timestamps = [dt.strftime('%Y-%m-%d %H:%M:%S') for dt in future_times]
    
    return forecasts, forecast_timestamps, model

def plot_forecast(historical_values, historical_timestamps, 
                  forecast_values, forecast_timestamps, 
                  title="PM2.5 Forecast"):
    plt.figure(figsize=(12, 6))
    
    # to datetime obj
    hist_times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in historical_timestamps]
    fore_times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in forecast_timestamps]
    
    # plot
    plt.plot(hist_times, historical_values, label='Historical Data')
    plt.plot(fore_times, forecast_values, 'r--', label='Forecast')
    
    plt.axvline(x=hist_times[-1], color='k', linestyle='--')
    plt.text(hist_times[-1], max(historical_values), 'Forecast Start', 
             horizontalalignment='center', verticalalignment='bottom')
    
    plt.title(title)
    plt.xlabel('Time')
    plt.ylabel('PM2.5 (μg/m³)')
    plt.legend()
    plt.grid(True)
    plt.gcf().autofmt_xdate()
    plt.tight_layout()
    
    return plt

def evaluate_model_on_test_data(train_data, test_data, test_timestamps, p, d, q):
    """
    Evaluate ARIMA model on test data and create validation plots
    
    Args:
        train_data: Training data for model fitting
        test_data: Test data to compare against predictions
        test_timestamps: Timestamps for test data
        p, d, q: ARIMA parameters
    
    Returns:
        tuple: (evaluation_metrics, model)
    """
    # fit model on training data
    model = ARIMA(p=p, d=d, q=q)
    model.fit(train_data)
    
    # generate predictions for test period
    test_predictions = model.forecast(len(test_data))
    
    # calculate evaluation metrics
    metrics = model.evaluate(test_data, test_predictions)
    
    # create validation plots
    test_vs_pred_plt = plot_test_vs_predicted(
        test_data, test_predictions, test_timestamps,
        title=f"ARIMA({p},{d},{q}) Test vs Predicted PM2.5 Values"
    )
    test_vs_pred_plt.savefig("pm25_test_vs_predicted.png")
    
    # error analysis
    error_plt = plot_error_analysis(test_data, test_predictions, test_timestamps)
    error_plt.savefig("pm25_error_analysis.png")
    
    return metrics, test_predictions, model

def compare_arima_implementations(data, train_size, p, d, q, forecast_steps=24):
    """
    Compare custom ARIMA implementation with statsmodels ARIMA
    
    Args:
        data: Input time series data
        train_size: Size of training data
        p, d, q: ARIMA parameters
        forecast_steps: Number of steps to forecast
    
    Returns:
        dict: Comparison metrics and forecasts
    """
    # split data
    train_data = data[:train_size]
    test_data = data[train_size:]
    
    # our arima
    custom_model = ARIMA(p=p, d=d, q=q)
    custom_model.fit(train_data)
    custom_test_pred = custom_model.forecast(len(test_data))
    custom_future_pred = custom_model.forecast(forecast_steps)
    
    # their (statsmodel) ARIMA
    stats_model = StatsARIMA(train_data, order=(p,d,q))
    stats_fit = stats_model.fit()
    stats_test_pred = stats_fit.forecast(len(test_data))
    stats_future_pred = stats_fit.forecast(forecast_steps)
    
    # calc metrics for test pred
    custom_metrics = custom_model.evaluate(test_data, custom_test_pred)
    
    # calc same metrics for statsmodels
    stats_mse = np.mean((test_data - stats_test_pred) ** 2)
    stats_rmse = np.sqrt(stats_mse)
    stats_mae = np.mean(np.abs(test_data - stats_test_pred))
    
    non_zero = (test_data != 0)
    if np.any(non_zero):
        stats_mape = np.mean(np.abs((test_data[non_zero] - stats_test_pred[non_zero]) / test_data[non_zero])) * 100
    else:
        stats_mape = float('inf')
    
    stats_metrics = {
        "MSE": stats_mse,
        "RMSE": stats_rmse,
        "MAE": stats_mae,
        "MAPE": stats_mape
    }
    
    return {
        "custom_metrics": custom_metrics,
        "stats_metrics": stats_metrics,
        "custom_test_pred": custom_test_pred,
        "stats_test_pred": stats_test_pred,
        "custom_future_pred": custom_future_pred,
        "stats_future_pred": stats_future_pred
    }

def plot_implementation_comparison(data, timestamps, comparison_results, train_size):
    test_timestamps = timestamps[train_size:]
    
    plt.figure(figsize=(15, 10))
    
    # test data comparison
    plt.subplot(2, 1, 1)
    test_times = [datetime.strptime(ts, '%Y-%m-%d %H:%M:%S') for ts in test_timestamps]
    test_data = data[train_size:]
    
    plt.plot(test_times, test_data, 'b-', label='Actual Test Data')
    plt.plot(test_times, comparison_results['custom_test_pred'], 'r--', 
             label='Custom ARIMA Predictions')
    plt.plot(test_times, comparison_results['stats_test_pred'], 'g--', 
             label='Statsmodels ARIMA Predictions')
    
    plt.title('Test Data Predictions Comparison')
    plt.xlabel('Time')
    plt.ylabel('PM2.5 (μg/m³)')
    plt.legend()
    plt.grid(True)
    plt.gcf().autofmt_xdate()
    
    # metrics Comparison
    plt.subplot(2, 1, 2)
    metrics = ['RMSE', 'MAE', 'MAPE']
    custom_values = [comparison_results['custom_metrics'][m] for m in metrics]
    stats_values = [comparison_results['stats_metrics'][m] for m in metrics]
    
    x = np.arange(len(metrics))
    width = 0.35
    
    plt.bar(x - width/2, custom_values, width, label='Custom ARIMA')
    plt.bar(x + width/2, stats_values, width, label='Statsmodels ARIMA')
    
    plt.xticks(x, metrics)
    plt.title('Metrics Comparison')
    plt.ylabel('Value')
    plt.legend()
    
    plt.tight_layout()
    return plt

def main():
    station_id = "bkp78t"

    end_date = pd.Timestamp.today().strftime('%Y-%m-%d')
    start_date = (pd.Timestamp.today() - pd.Timedelta(days=10)).strftime('%Y-%m-%d')  # get more data for better testing
    
    print(f"Fetching PM2.5 data for station {station_id} from {start_date} to {end_date}...")
    
    pm25_values, timestamps = get_pm25_data_from_api(station_id, start_date, end_date)
    
    if len(pm25_values) == 0:
        print("No data retrieved. Exiting.")
        return
    
    print(f"Retrieved {len(pm25_values)} data points.")
    
    plt = plot_pm25_data(pm25_values, timestamps)
    plt.savefig("pm25_historical.png")
    print("Historical data plot saved as 'pm25_historical.png'")
    
    print("\nFinding optimal ARIMA parameters...")
    
    # 80 / 20 test
    train_size = int(len(pm25_values) * 0.8)
    train_data = pm25_values[:train_size]
    test_data = pm25_values[train_size:]
    test_timestamps = timestamps[train_size:]
    
    best_rmse = float('inf')
    best_params = (1, 1, 0) # default param if nothing works out
    all_results = []
    
    # grid search
    for p in [1, 2, 3]:
        for d in [0, 1]:
            for q in [0, 1, 2]:
                try:
                    model = ARIMA(p=p, d=d, q=q)
                    model.fit(train_data)
                    
                    # try to gen forecast for validation data
                    forecasts = model.forecast(len(test_data))
                    
                    # evaluation metrics
                    metrics = model.evaluate(test_data, forecasts)
                    rmse = metrics["RMSE"]
                    
                    result = {
                        "params": (p, d, q),
                        "rmse": rmse,
                        "mae": metrics["MAE"],
                        "mape": metrics.get("MAPE", float('inf'))
                    }
                    all_results.append(result)
                    
                    print(f"ARIMA({p},{d},{q}) - RMSE: {rmse:.4f}, MAE: {metrics['MAE']:.4f}")
                    
                    if rmse < best_rmse:
                        best_rmse = rmse
                        best_params = (p, d, q)
                except Exception as e:
                    print(f"Error with ARIMA({p},{d},{q}): {str(e)}")
    
    # sort by rmse (i might try AIC later)
    all_results.sort(key=lambda x: x["rmse"])
    
    p, d, q = best_params
    print(f"\nBest parameters: ARIMA({p},{d},{q}) with RMSE: {best_rmse:.4f}")
    
    # top 3 models
    print("\nTop 3 models by RMSE:")
    for i in range(min(3, len(all_results))):
        p_i, d_i, q_i = all_results[i]["params"]
        print(f"ARIMA({p_i},{d_i},{q_i}) - RMSE: {all_results[i]['rmse']:.4f}, MAE: {all_results[i]['mae']:.4f}")
    
    # detailed eval of best model on test data
    print(f"\nDetailed evaluation of best model ARIMA({p},{d},{q}) on test data:")
    test_metrics, test_predictions, best_model = evaluate_model_on_test_data(
        train_data, test_data, test_timestamps, p, d, q
    )
    
    print("Test Data Evaluation Metrics:")
    for metric, value in test_metrics.items():
        if metric != "n":
            print(f"  {metric}: {value:.4f}")
    
    # after finding best parameters, add comparison
    print("\nComparing custom ARIMA with statsmodels implementation...")
    
    comparison_results = compare_arima_implementations(
        pm25_values, train_size, p, d, q
    )
    
    print("\nCustom ARIMA Metrics:")
    for metric, value in comparison_results['custom_metrics'].items():
        if metric != 'n':
            print(f"  {metric}: {value:.4f}")
    
    print("\nStatsmodels ARIMA Metrics:")
    for metric, value in comparison_results['stats_metrics'].items():
        print(f"  {metric}: {value:.4f}")
    
    # plot comparison
    plt = plot_implementation_comparison(
        pm25_values, timestamps, comparison_results, train_size
    )
    plt.savefig("pm25_implementation_comparison.png")
    print("\nComparison plot saved as 'pm25_implementation_comparison.png'")
    
    # gen for 24 hrs
    forecast_hours = 24
    print(f"\nGenerating {forecast_hours}-hour forecast using ARIMA({p},{d},{q})...")
    
    # fit model on all data for future forecasting
    forecasts, forecast_timestamps, _ = forecast_pm25(
        pm25_values, timestamps, forecast_hours=forecast_hours, p=p, d=d, q=q
    )

    # output    
    print("\nPM2.5 Forecasts:")
    for ts, value in zip(forecast_timestamps, forecasts):
        print(f"{ts}: {value:.1f} μg/m³")

    # plot    
    plt = plot_forecast(
        pm25_values, timestamps, 
        forecasts, forecast_timestamps, 
        title=f"PM2.5 Forecast using ARIMA({p},{d},{q})"
    )
    plt.savefig("pm25_forecast.png")
    print("\nForecast plot saved as 'pm25_forecast.png'")
    
    print("\nAll plots generated:")
    print("1. pm25_historical.png - Historical data")
    print("2. pm25_test_vs_predicted.png - Test data vs model predictions")
    print("3. pm25_error_analysis.png - Error analysis")
    print("4. pm25_forecast.png - Future forecast")
    print("5. pm25_implementation_comparison.png - Comparison between custom and statsmodels ARIMA")

def load_data_from_json(json_path):
    """
    for debug...
    args:
        json_path (str): Path to the JSON file
        
    ret:
        tuple: (pm25_values, timestamps)
    """
    with open(json_path, 'r') as f:
        data = json.loads(f.read())
    
    pm25_values = []
    timestamps = []
    
    for item in data['stations'][0]['data']:
        if item['PM25'] is not None:  # skip null values
            pm25_values.append(item['PM25'])
            timestamps.append(item['DATETIMEDATA'])
    
    return np.array(pm25_values), timestamps

if __name__ == "__main__":
    main()

# json debug
"""
pm25_values, timestamps = load_data_from_json('paste.txt')

# Split data for training and testing
train_size = int(len(pm25_values) * 0.8)
train_data = pm25_values[:train_size]
test_data = pm25_values[train_size:]
test_timestamps = timestamps[train_size:]

# Define ARIMA parameters
p, d, q = 2, 1, 1

# Evaluate on test data
test_metrics, test_predictions, _ = evaluate_model_on_test_data(
    train_data, test_data, test_timestamps, p, d, q
)

# Generate future forecast
forecast_hours = 24
forecasts, forecast_timestamps, _ = forecast_pm25(
    pm25_values, timestamps, forecast_hours=forecast_hours, p=p, d=d, q=q
)

# Plot future forecast
plt = plot_forecast(
    pm25_values, timestamps, 
    forecasts, forecast_timestamps, 
    title=f"PM2.5 Forecast using ARIMA({p},{d},{q})"
)
plt.savefig("pm25_forecast.png")
"""