const FIREBASE_BASE_URL = "https://aqi-project-1b817-default-rtdb.asia-southeast1.firebasedatabase.app";

export class FirebaseAPI {
  static async fetchSensorData() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/air_quality/sensorData.json`);
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      const data = await response.json();
      
      if (!data) return [];
      
      // Convert Firebase object structure to array
      return Object.entries(data).map(([timestamp, values]) => ({
        timestamp: timestamp,
        ...values,
        aqi_calculated: this.calculateAQI(values)
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  static async fetchPredictions() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/air_quality/predictions.json`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      const data = await response.json();
      
      if (!data) return [];
      
      const predictions = [];
      
      // Process each prediction period
      Object.entries(data).forEach(([period, periodData]) => {
        if (periodData && typeof periodData === 'object') {
          Object.entries(periodData).forEach(([timestamp, values]) => {
            predictions.push({
              prediction_timestamp: timestamp,
              prediction_period: period,
              ...values,
              aqi_prediction: this.calculateAQI(values),
              confidence_score: this.calculateConfidence(period)
            });
          });
        }
      });
      
      return predictions.sort((a, b) => new Date(b.prediction_timestamp) - new Date(a.prediction_timestamp));
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }

  static async fetchMetadata() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/air_quality/metadata.json`);
      if (!response.ok) throw new Error('Failed to fetch metadata');
      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  }

  // Helper function to compare data arrays and detect changes
  static hasDataChanged(newData, oldData) {
    if (!oldData || oldData.length !== newData.length) return true;
    
    // Compare first few items for changes (since data is sorted by timestamp)
    for (let i = 0; i < Math.min(3, newData.length); i++) {
      if (JSON.stringify(newData[i]) !== JSON.stringify(oldData[i])) {
        return true;
      }
    }
    return false;
  }

  // Calculate AQI based on PM2.5 (simplified US EPA standard)
  static calculateAQI(values) {
    const pm25 = parseFloat(values.PM2_5 || values.PM2_5 || 0);
    
    if (pm25 <= 12.0) return Math.round(pm25 * 50 / 12.0);
    if (pm25 <= 35.4) return Math.round(51 + (pm25 - 12.1) * 49 / 23.3);
    if (pm25 <= 55.4) return Math.round(101 + (pm25 - 35.5) * 49 / 19.9);
    if (pm25 <= 150.4) return Math.round(151 + (pm25 - 55.5) * 49 / 94.9);
    if (pm25 <= 250.4) return Math.round(201 + (pm25 - 150.5) * 99 / 99.9);
    return Math.round(301 + (pm25 - 250.5) * 99 / 99.9);
  }

  // Calculate confidence based on prediction period
  static calculateConfidence(period) {
    const confidenceMap = {
      '6hours': 92,
      'hour': 95,
      'day': 88,
      '48hours': 82,
      'week': 75,
      'month': 65,
      '15days': 68
    };
    return confidenceMap[period] || 70;
  }
}