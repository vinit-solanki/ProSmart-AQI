import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, TrendingUp, Calendar, Eye, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FirebaseAPI } from "./components/services/firebaseApi";
import AQIStatusCard from "./components/dashboard/AQIStatusCard";
import MetricsGrid from "./components/dashboard/MetricsGrid";
import SensorChart from "./components/dashboard/SensorChart";
import MaximizableChart from "./components/dashboard/MaximizableChart";
import PredictionCard from "./components/dashboard/PredictionCard";
import LoadingSpinner from "./components/dashboard/LoadingSpinner";
import LiveStatusBadge from "./components/dashboard/LiveStatusBadge";
import DataSourceInfo from "./components/dashboard/DataSourceInfo";

export default function App() {
  const [sensorData, setSensorData] = useState([]);
  const [currentSensorData, setCurrentSensorData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState("current");
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(true);

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (sensorData.length === 0) {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const [currentResponse, sensorResponse, predictionResponse, forecastResponse, metadataResponse] = await Promise.all([
        FirebaseAPI.fetchCurrentData(),
        FirebaseAPI.fetchSensorData(),
        FirebaseAPI.fetchPredictions(),
        FirebaseAPI.fetchForecastData(),
        FirebaseAPI.fetchMetadata()
      ]);
      
      // Update current data only if manually refreshing or first load
      if (currentResponse && (isManualRefresh || !currentSensorData)) {
        setCurrentSensorData(currentResponse);
      }
      
      // Update historical data for charts
      if (FirebaseAPI.hasDataChanged(sensorResponse, sensorData)) {
        setSensorData(sensorResponse);
      }
      
      if (FirebaseAPI.hasDataChanged(predictionResponse, predictions)) {
        setPredictions(predictionResponse);
      }

      if (FirebaseAPI.hasDataChanged(forecastResponse, forecastData)) {
        setForecastData(forecastResponse);
      }
      
      if (JSON.stringify(metadataResponse) !== JSON.stringify(metadata)) {
        setMetadata(metadataResponse);
      }
      
      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data from Firebase. Please check your connection.");
      setIsConnected(false);
    }
    
    setIsLoading(false);
    setIsRefreshing(false);
  }, [sensorData, currentSensorData, predictions, forecastData, metadata]);

  useEffect(() => {
    // Load data only once on mount
    loadData();
    
    // Set up polling with the Firebase API's built-in polling method
    const stopPolling = FirebaseAPI.startPolling((newCurrentData) => {
      // Only update if data has actually changed
      if (FirebaseAPI.hasCurrentDataChanged(newCurrentData, currentSensorData)) {
        setCurrentSensorData(newCurrentData);
        setLastUpdated(new Date());
        setIsConnected(true);
        setError(null);
      }
    }, 30000); // Poll every 30 seconds
    
    return () => {
      stopPolling();
    };
  }, []); // Empty dependency array - only run once on mount

  const currentData = useMemo(() => currentSensorData || sensorData[0], [currentSensorData, sensorData]);
  const currentAQI = useMemo(() => currentData?.aqi_calculated || 0, [currentData]);
  
  const predictionsByPeriod = useMemo(() => {
    return predictions.reduce((acc, pred) => {
      if (!acc[pred.prediction_period]) acc[pred.prediction_period] = [];
      acc[pred.prediction_period].push(pred);
      return acc;
    }, {});
  }, [predictions]);

  const getAQITrend = useCallback(() => {
    if (sensorData.length < 2) return 0;
    
    const current = sensorData[0]?.aqi_calculated || 0;
    const currentTime = new Date(sensorData[0]?.timestamp);
    const twentyFourHoursAgo = new Date(currentTime.getTime() - (24 * 60 * 60 * 1000));
    
    // Find data point closest to 24 hours ago
    let previousAQI = null;
    let closestTimeDiff = Infinity;
    
    for (let i = 1; i < sensorData.length; i++) {
      const dataTime = new Date(sensorData[i]?.timestamp);
      const timeDiff = Math.abs(dataTime.getTime() - twentyFourHoursAgo.getTime());
      
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        previousAQI = sensorData[i]?.aqi_calculated || 0;
      }
    }
    
    if (!previousAQI || previousAQI === 0) return 0;
    return ((current - previousAQI) / previousAQI * 100).toFixed(1);
  }, [sensorData]);

  const formatDataForChart = useCallback((data, timestampKey = 'timestamp') => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => {
      const timestamp = item[timestampKey] || item.prediction_timestamp;
      const date = new Date(timestamp);
      
      // Return a stable object structure with unique key
      return {
        id: `${timestamp || 'unknown'}-${index}`, // Add unique ID for React keys
        timestamp: timestamp,
        time: date.toLocaleTimeString(),
        fullDate: date.toLocaleString(),
        CO: item.CO || 0,
        NO2: item.NO2 || 0,
        O3: item.O3 || 0,
        PM10: item.PM10 || 0,
        PM2_5: item.PM2_5 || 0,
        SO2: item.SO2 || 0,
        TEMP: item.TEMP || 0,
        aqi_calculated: item.aqi_calculated || 0
      };
    });
  }, []);

  // Memoized chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    return formatDataForChart(sensorData);
  }, [sensorData, formatDataForChart]);

  const sensorAnalytics = useMemo(() => {
    if (sensorData.length === 0) return { totalRecords: 0, avgAQI: 0, peakPM25: 0, dateRange: null };
    
    return {
      totalRecords: sensorData.length,
      avgAQI: (sensorData.reduce((acc, item) => acc + (item.aqi_calculated || 0), 0) / sensorData.length).toFixed(0),
      peakPM25: Math.max(...sensorData.map(item => item.PM2_5 || 0)).toFixed(1),
      dateRange: {
        start: sensorData[sensorData.length - 1]?.timestamp 
          ? new Date(sensorData[sensorData.length - 1].timestamp).toLocaleDateString()
          : 'Unknown',
        end: sensorData[0]?.timestamp 
          ? new Date(sensorData[0].timestamp).toLocaleDateString()
          : 'Unknown'
      }
    };
  }, [sensorData]);

  const forecastAnalytics = useMemo(() => {
    if (forecastData.length === 0) {
      return {
        avgAQI: '--',
        peakPM25: '--',
        avgCO: '--',
        peakNO2: '--'
      };
    }

    return {
      avgAQI: (forecastData.reduce((acc, item) => acc + (item.aqi_calculated || 0), 0) / forecastData.length).toFixed(0),
      peakPM25: Math.max(...forecastData.map(item => item.PM2_5 || 0)).toFixed(1),
      avgCO: (forecastData.reduce((acc, item) => acc + (item.CO || 0), 0) / forecastData.length).toFixed(1),
      peakNO2: Math.max(...forecastData.map(item => item.NO2 || 0)).toFixed(1)
    };
  }, [forecastData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner size="xl" text="Connecting to KonnectSens sensors..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-200">
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-blue-600 bg-clip-text text-transparent">
                ProSmart-AQI
              </h1>
              <p className="text-gray-600 mt-2">Real-time air quality monitoring and predictions</p>
            </div>
            <div className="bg-black/20 p-5 rounded-lg text-center space-y-2">
              <h2 className="text-lg font-semibold">Data  Source Link:</h2>
              <a href="https://github.com/vinit-solanki/ProSmart-AQI/blob/main/MODEL/dataairquality_data.csv">
              <button className="text-gray-900 bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-100 cursor-pointer">Click Here</button>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <LiveStatusBadge 
                isConnected={isConnected} 
                lastUpdated={lastUpdated} 
              />
              <div className="text-sm text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </Button>
            </div>
          </motion.div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Data Source Info */}
          <DataSourceInfo metadata={metadata} />

          {/* Current AQI Status */}
          <AQIStatusCard 
            currentAQI={currentAQI} 
            trend={parseFloat(getAQITrend())} 
          />

          {/* Metrics Grid */}
          <MetricsGrid sensorData={currentData} historicalData={sensorData} />

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 border-gray-200">
              <TabsTrigger 
                value="predictions" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                AI Predictions
              </TabsTrigger>
              <TabsTrigger 
                value="current" 
                className="data-[state=active]:bg-teal-600 data-[state=active]:text-white flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Historical Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="space-y-6">
              <motion.div
                key="current"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                  {sensorData.length > 0 ? (
                    <>
                      {/* Historical Charts Grid */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MaximizableChart
                          key="pm2_5-chart"
                          data={chartData}
                          title="PM2.5 Particulate Matter"
                          dataKey="PM2_5"
                          color="#f97316"
                          type="area"
                          delay={0}
                        />
                        <MaximizableChart
                          key="pm10-chart"
                          data={chartData}
                          title="PM10 Particulate Matter"
                          dataKey="PM10"
                          color="#8b5cf6"
                          type="area"
                          delay={0.1}
                        />
                        <MaximizableChart
                          key="so2-chart"
                          data={chartData}
                          title="Sulfur Dioxide (SO2)"
                          dataKey="SO2"
                          color="#ef4444"
                          type="line"
                          delay={0.2}
                        />
                        <MaximizableChart
                          key="no2-chart"
                          data={chartData}
                          title="Nitrogen Dioxide (NO2)"
                          dataKey="NO2"
                          color="#f59e0b"
                          type="line"
                          delay={0.3}
                        />
                        <MaximizableChart
                          key="o3-chart"
                          data={chartData}
                          title="Ozone (O3)"
                          dataKey="O3"
                          color="#10b981"
                          type="line"
                          delay={0.4}
                        />
                        <MaximizableChart
                          key="temp-chart"
                          data={chartData}
                          title="Temperature"
                          dataKey="TEMP"
                          color="#f97316"
                          type="area"
                          delay={0.5}
                        />
                        <MaximizableChart
                          key="co-chart"
                          data={chartData}
                          title="Carbon Monoxide (CO)"
                          dataKey="CO"
                          color="#6b7280"
                          type="line"
                          delay={0.6}
                        />
                      </div>

                      {/* Data Summary */}
                      <Card className="mt-5 bg-white border-gray-200 shadow-md">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <Database className="w-5 h-5 text-teal-600" />
                            Sensor Data Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-4 gap-6 text-sm">
                            <div>
                              <div className="text-gray-500 mb-1">Total Records</div>
                              <div className="text-2xl font-bold text-gray-900">{sensorAnalytics.totalRecords}</div>
                              <div className="text-xs text-gray-400">sensor readings</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Average AQI</div>
                              <div className="text-2xl font-bold text-teal-600">{sensorAnalytics.avgAQI}</div>
                              <div className="text-xs text-gray-400">air quality index</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Peak PM2.5</div>
                              <div className="text-2xl font-bold text-orange-600">{sensorAnalytics.peakPM25} μg/m³</div>
                              <div className="text-xs text-gray-400">maximum recorded</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Data Range</div>
                              <div className="text-sm font-semibold text-gray-700">
                                {sensorAnalytics.dateRange?.start}
                              </div>
                              <div className="text-xs text-gray-400">
                                to {sensorAnalytics.dateRange?.end}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="bg-white border-gray-200 shadow-md">
                      <CardContent className="py-12">
                        <div className="text-center text-gray-500">
                          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No sensor data available</p>
                          <p className="text-sm mt-1">Please check your sensor connections</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>

            <TabsContent value="predictions" className="space-y-6">
              <motion.div
                key="predictions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                  {forecastData.length > 0 ? (
                    <>
                      {/* 48 Hours Prediction Title */}
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">48 Hours Prediction</h2>
                        <p className="text-gray-600">AI-powered forecast for the next 48 hours based on current sensor data</p>
                      </div>

                      {/* Forecast Charts Grid */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <MaximizableChart
                          key="forecast-pm2_5-chart"
                          data={formatDataForChart(forecastData)}
                          title="PM2.5 Forecast"
                          dataKey="PM2_5"
                          color="#f97316"
                          type="area"
                          delay={0}
                        />
                        <MaximizableChart
                          key="forecast-pm10-chart"
                          data={formatDataForChart(forecastData)}
                          title="PM10 Forecast"
                          dataKey="PM10"
                          color="#8b5cf6"
                          type="area"
                          delay={0.1}
                        />
                        <MaximizableChart
                          key="forecast-so2-chart"
                          data={formatDataForChart(forecastData)}
                          title="SO2 Forecast"
                          dataKey="SO2"
                          color="#ef4444"
                          type="line"
                          delay={0.2}
                        />
                        <MaximizableChart
                          key="forecast-no2-chart"
                          data={formatDataForChart(forecastData)}
                          title="NO2 Forecast"
                          dataKey="NO2"
                          color="#f59e0b"
                          type="line"
                          delay={0.3}
                        />
                        <MaximizableChart
                          key="forecast-o3-chart"
                          data={formatDataForChart(forecastData)}
                          title="O3 Forecast"
                          dataKey="O3"
                          color="#10b981"
                          type="line"
                          delay={0.4}
                        />
                        <MaximizableChart
                          key="forecast-co-chart"
                          data={formatDataForChart(forecastData)}
                          title="CO Forecast"
                          dataKey="CO"
                          color="#6b7280"
                          type="line"
                          delay={0.5}
                        />
                      </div>

                      {/* Prediction Analytics */}
                      <Card className="mt-5 bg-white border-gray-200 shadow-md">
                        <CardHeader>
                          <CardTitle className="text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            AI Model Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-500 mb-1">Average AQI</div>
                              <div className="text-xl font-bold text-blue-600">{forecastAnalytics.avgAQI}</div>
                              <div className="text-xs text-gray-400">48h forecast average</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Peak PM2.5</div>
                              <div className="text-xl font-bold text-orange-600">{forecastAnalytics.peakPM25} μg/m³</div>
                              <div className="text-xs text-gray-400">forecast maximum</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Average CO</div>
                              <div className="text-xl font-bold text-green-600">{forecastAnalytics.avgCO} ppm</div>
                              <div className="text-xs text-gray-400">48h forecast average</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Peak NO2</div>
                              <div className="text-xl font-bold text-teal-600">{forecastAnalytics.peakNO2} ppb</div>
                              <div className="text-xs text-gray-400">forecast maximum</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="bg-white border-gray-200 shadow-md">
                      <CardContent className="py-12">
                        <div className="text-center text-gray-500">
                          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No forecast data available</p>
                          <p className="text-sm mt-1">AI models are generating predictions</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}