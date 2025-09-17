const FIREBASE_BASE_URL = "https://aqipred-727b6-default-rtdb.firebaseio.com";

export class FirebaseAPI {
  // Helper function to extract value from nested objects
  static extractValue(obj) {
    if (typeof obj === 'number') return obj;
    if (typeof obj === 'string') return parseFloat(obj) || 0;
    if (typeof obj === 'object' && obj !== null) {
      // Try common property names
      return obj.value || obj.val || obj.data || obj.amount || 0;
    }
    return 0;
  }
  static async fetchCurrentData() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/current.json`);
      if (!response.ok) throw new Error('Failed to fetch current data');
      const data = await response.json();
      
      if (!data) return null;

      // Get the latest timestamp from any sensor
      let latestTimestamp = null;
      let latestValues = {};
      
      // Find the most recent timestamp across all sensors (ignore "value" timestamps)
      Object.keys(data).forEach(sensor => {
        if (data[sensor] && typeof data[sensor] === 'object') {
          Object.keys(data[sensor]).forEach(timestamp => {
            // Skip invalid timestamps like "value"
            if (timestamp !== 'value' && timestamp.includes('T') && (!latestTimestamp || timestamp > latestTimestamp)) {
              latestTimestamp = timestamp;
            }
          });
        }
      });
      
      if (!latestTimestamp) return null;
      
      // Extract values for the latest timestamp
      Object.keys(data).forEach(sensor => {
        if (data[sensor] && data[sensor][latestTimestamp] !== undefined) {
          // Extract the actual value from the nested structure
          const rawValue = data[sensor][latestTimestamp];
          latestValues[sensor] = this.extractValue(rawValue);
        }
      });
      
      // Process current data and calculate AQI (handle both cases)
      const processedData = {
        timestamp: latestTimestamp,
        CO: latestValues.CO || latestValues.co || 0,
        NO2: latestValues.NO2 || latestValues.no2 || 0,
        O3: latestValues.O3 || latestValues.o3 || 0,
        PM10: latestValues.PM10 || latestValues.pm10 || 0,
        PM2_5: latestValues.PM2_5 || latestValues.pm2_5 || 0,
        SO2: latestValues.SO2 || latestValues.so2 || 0,
        TEMP: latestValues.TEMP || latestValues.temp || 0,
        aqi_calculated: this.calculateAQI({
          CO: latestValues.CO || latestValues.co || 0,
          NO2: latestValues.NO2 || latestValues.no2 || 0,
          O3: latestValues.O3 || latestValues.o3 || 0,
          PM10: latestValues.PM10 || latestValues.pm10 || 0,
          PM2_5: latestValues.PM2_5 || latestValues.pm2_5 || 0,
          SO2: latestValues.SO2 || latestValues.so2 || 0
        })
      };
      
      return processedData;
    } catch (error) {
      console.error('Error fetching current data:', error);
      return null;
    }
  }

  static async fetchSensorData() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/history.json`);
      if (!response.ok) throw new Error('Failed to fetch sensor data');
      const data = await response.json();
      
      
      if (!data) return [];
      
      // Collect all timestamps from all sensors
      const allTimestamps = new Set();
      Object.keys(data).forEach(sensor => {
        if (data[sensor] && typeof data[sensor] === 'object') {
          Object.keys(data[sensor]).forEach(timestamp => {
            allTimestamps.add(timestamp);
          });
        }
      });
      
      // Convert to array and sort (newest first)
      const sortedTimestamps = Array.from(allTimestamps).sort().reverse();
      
      // Limit to latest 80 hours
      const now = new Date();
      const eightyHoursAgo = new Date(now.getTime() - (80 * 60 * 60 * 1000));
      
      const filteredTimestamps = sortedTimestamps.filter(timestamp => {
        const itemDate = new Date(timestamp);
        return itemDate >= eightyHoursAgo;
      });
      
      
      // Create historical data array
      const historicalData = filteredTimestamps.map(timestamp => {
        const values = {
          timestamp: timestamp,
          CO: 0,
          NO2: 0,
          O3: 0,
          PM10: 0,
          PM2_5: 0,
          SO2: 0,
          TEMP: 0
        };
        
        // Extract values for this timestamp from each sensor (handle case sensitivity)
        Object.keys(data).forEach(sensor => {
          if (data[sensor] && data[sensor][timestamp] !== undefined) {
            const value = this.extractValue(data[sensor][timestamp]);
            
            // Map sensor names to consistent format
            switch(sensor.toUpperCase()) {
              case 'CO':
                values.CO = value;
                break;
              case 'NO2':
                values.NO2 = value;
                break;
              case 'O3':
                values.O3 = value;
                break;
              case 'PM10':
                values.PM10 = value;
                break;
              case 'PM2_5':
              case 'PM2.5':
                values.PM2_5 = value;
                break;
              case 'SO2':
                values.SO2 = value;
                break;
              case 'TEMP':
              case 'TEMPERATURE':
                values.TEMP = value;
                break;
              default:
                values[sensor] = value;
            }
          }
        });
        
        // Calculate AQI
        values.aqi_calculated = this.calculateAQI(values);
        
        return values;
      });
      
      // Sort chronologically for proper chart display (oldest to newest)
      historicalData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      
      return historicalData;
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      return [];
    }
  }

  static async fetchPredictions() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/forecast.json`);
      if (!response.ok) throw new Error('Failed to fetch predictions');
      const data = await response.json();
      
      if (!data) return [];
      
      const predictions = [];
      
      // Process forecast data - assuming it's structured with timestamps
      Object.entries(data).forEach(([timestamp, values]) => {
        predictions.push({
          prediction_timestamp: timestamp,
          prediction_period: 'forecast',
          ...values,
          aqi_prediction: this.calculateAQI(values),
          confidence_score: this.calculateConfidence('forecast')
        });
      });
      
      return predictions.sort((a, b) => new Date(b.prediction_timestamp) - new Date(a.prediction_timestamp));
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return [];
    }
  }

  static async fetchForecastData() {
    try {
      const response = await fetch(`${FIREBASE_BASE_URL}/forecast.json`);
      if (!response.ok) throw new Error('Failed to fetch forecast data');
      const data = await response.json();
      
      if (!data) return [];
      
      // Collect all timestamps from all sensors
      const allTimestamps = new Set();
      Object.keys(data).forEach(sensor => {
        if (data[sensor] && typeof data[sensor] === 'object') {
          Object.keys(data[sensor]).forEach(timestamp => {
            // Skip invalid timestamps like "value"
            if (timestamp !== 'value' && timestamp.includes('T')) {
              allTimestamps.add(timestamp);
            }
          });
        }
      });
      
      // Convert to array and sort (oldest to newest for forecasts)
      const sortedTimestamps = Array.from(allTimestamps).sort();
      
      // Create forecast data array
      const forecastData = sortedTimestamps.map(timestamp => {
        const values = {
          timestamp: timestamp,
          CO: 0,
          NO2: 0,
          O3: 0,
          PM10: 0,
          PM2_5: 0,
          SO2: 0,
          TEMP: 0
        };
        
        // Extract values for this timestamp from each sensor (handle case sensitivity)
        Object.keys(data).forEach(sensor => {
          if (data[sensor] && data[sensor][timestamp] !== undefined) {
            const value = this.extractValue(data[sensor][timestamp]);
            
            // Map sensor names to consistent format
            switch(sensor.toUpperCase()) {
              case 'CO':
                values.CO = value;
                break;
              case 'NO2':
                values.NO2 = value;
                break;
              case 'O3':
                values.O3 = value;
                break;
              case 'PM10':
                values.PM10 = value;
                break;
              case 'PM2_5':
              case 'PM2.5':
                values.PM2_5 = value;
                break;
              case 'SO2':
                values.SO2 = value;
                break;
              case 'TEMP':
              case 'TEMPERATURE':
                values.TEMP = value;
                break;
              default:
                values[sensor] = value;
            }
          }
        });
        
        // Calculate AQI for forecast
        values.aqi_calculated = this.calculateAQI(values);
        
        return values;
      });
      
      return forecastData;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      return [];
    }
  }

  static async fetchMetadata() {
    try {
      // Since metadata might not exist in new structure, return default info
      return {
        source: "KonnectSens IoT Sensors",
        location: "Smart City Monitoring Network",
        lastUpdated: new Date().toISOString(),
        dataPoints: ["CO", "NO2", "O3", "PM10", "PM2_5", "SO2", "TEMP"]
      };
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

  static hasCurrentDataChanged(newData, oldData) {
    if (!oldData || !newData) return true;
    
    // Compare timestamp and key sensor values
    return newData.timestamp !== oldData.timestamp ||
           newData.CO !== oldData.CO ||
           newData.NO2 !== oldData.NO2 ||
           newData.O3 !== oldData.O3 ||
           newData.PM10 !== oldData.PM10 ||
           newData.PM2_5 !== oldData.PM2_5 ||
           newData.SO2 !== oldData.SO2 ||
           newData.TEMP !== oldData.TEMP;
  }

  // Calculate AQI based on PM2.5 (simplified US EPA standard)
  static calculateAQI(values) {
    const pm25 = parseFloat(values.PM2_5 || values.pm2_5 || 0);
    
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
      '15days': 68,
      'forecast': 85
    };
    return confidenceMap[period] || 70;
  }

  // Real-time listening for current data updates
  static setupRealtimeListener(onDataUpdate) {
    const eventSource = new EventSource(`${FIREBASE_BASE_URL}/current.json`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data) {
          const processedData = {
            timestamp: new Date().toISOString(),
            ...data,
            aqi_calculated: this.calculateAQI(data)
          };
          onDataUpdate(processedData);
        }
      } catch (error) {
        console.error('Error parsing real-time data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time connection error:', error);
    };

    return eventSource;
  }

  // Alternative polling method for real-time updates (fallback)
  static startPolling(onDataUpdate, interval = 30000) {
    let lastData = null;
    
    const poll = async () => {
      try {
        const currentData = await this.fetchCurrentData();
        if (currentData && this.hasCurrentDataChanged(currentData, lastData)) {
          lastData = currentData;
          onDataUpdate(currentData);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    const intervalId = setInterval(poll, interval);
    
    return () => clearInterval(intervalId);
  }
}