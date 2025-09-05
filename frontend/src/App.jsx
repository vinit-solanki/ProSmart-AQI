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
import PredictionCard from "./components/dashboard/PredictionCard";
import LoadingSpinner from "./components/dashboard/LoadingSpinner";
import LiveStatusBadge from "./components/dashboard/LiveStatusBadge";
import DataSourceInfo from "./components/dashboard/DataSourceInfo";

export default function App() {
  const [sensorData, setSensorData] = useState([]);
  const [predictions, setPredictions] = useState([]);
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
      const [sensorResponse, predictionResponse, metadataResponse] = await Promise.all([
        FirebaseAPI.fetchSensorData(),
        FirebaseAPI.fetchPredictions(),
        FirebaseAPI.fetchMetadata()
      ]);
      
      // Only update state if data has actually changed
      if (FirebaseAPI.hasDataChanged(sensorResponse, sensorData)) {
        setSensorData(sensorResponse);
      }
      
      if (FirebaseAPI.hasDataChanged(predictionResponse, predictions)) {
        setPredictions(predictionResponse);
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
  }, [sensorData, predictions, metadata]);

  useEffect(() => {
    loadData();
    
    // Increased interval to 60 seconds to reduce API calls
    const interval = setInterval(() => loadData(), 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const currentData = useMemo(() => sensorData[0], [sensorData]);
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
    const previous = sensorData[1]?.aqi_calculated || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  }, [sensorData]);

  const formatDataForChart = useCallback((data, timestampKey = 'timestamp') => {
    return data?.map(item => ({
      ...item,
      timestamp: item[timestampKey] || item.prediction_timestamp
    })) || [];
  }, []);

  const sensorAnalytics = useMemo(() => {
    if (sensorData.length === 0) return { totalRecords: 0, avgAQI: 0, peakPM25: 0, dateRange: null };
    
    return {
      totalRecords: sensorData.length,
      avgAQI: (sensorData.reduce((acc, item) => acc + (item.aqi_calculated || 0), 0) / sensorData.length).toFixed(0),
      peakPM25: Math.max(...sensorData.map(item => item.PM2_5 || 0)).toFixed(1),
      dateRange: {
        start: new Date(sensorData[sensorData.length - 1]?.timestamp).toLocaleDateString(),
        end: new Date(sensorData[0]?.timestamp).toLocaleDateString()
      }
    };
  }, [sensorData]);

  const predictionAnalytics = useMemo(() => {
    return {
      next6hAQI: predictionsByPeriod["6hours"]?.[0]?.aqi_prediction?.toFixed(0) || '--',
      peak48hPM25: predictionsByPeriod["48hours"]?.length > 0 
        ? Math.max(...predictionsByPeriod["48hours"].map(p => p.PM2_5 || 0)).toFixed(1)
        : '--',
      weeklyTrend: getAQITrend() > 0 ? 'Worsening' : 'Improving',
      modelConfidence: predictionsByPeriod.week?.[0]?.confidence_score?.toFixed(0) || '--'
    };
  }, [predictionsByPeriod, getAQITrend]);

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
                ProMind
              </h1>
              <p className="text-gray-600 mt-2">Real-time air quality monitoring and predictions</p>
            </div>
            <div className="bg-black/20 p-5 rounded-lg text-center space-y-2">
              <h2 className="text-lg font-semibold">Data  Source Link:</h2>
              <a href="">
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
          <MetricsGrid sensorData={currentData} />

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

            <AnimatePresence mode="wait">
              <TabsContent value="current" className="space-y-6">
                <motion.div
                  key="current"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {sensorData.length > 0 ? (
                    <>
                      {/* Historical Charts Grid */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <SensorChart
                          data={formatDataForChart(sensorData)}
                          title="PM2.5 Particulate Matter"
                          dataKey="PM2_5"
                          color="#f97316"
                          type="area"
                        />
                        <SensorChart
                          data={formatDataForChart(sensorData)}
                          title="Air Quality Index (AQI)"
                          dataKey="aqi_calculated"
                          color="#0ea5e9"
                          type="line"
                        />
                        <SensorChart
                          data={formatDataForChart(sensorData)}
                          title="Carbon Dioxide (CO2)"
                          dataKey="CO2"
                          color="#eab308"
                          type="area"
                        />
                        <SensorChart
                          data={formatDataForChart(sensorData)}
                          title="Volatile Organic Compounds"
                          dataKey="VOCs"
                          color="#22c55e"
                          type="line"
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
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {predictions.length > 0 ? (
                    <>
                      {/* Prediction Cards Grid */}
                      <div className="mt-2 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {["6hours", "48hours", "week", "15days"].map((period, index) => (
                          <PredictionCard
                            key={period}
                            prediction={predictionsByPeriod[period]?.[0]}
                            period={period}
                            delay={index * 0.1}
                          />
                        ))}
                      </div>

                      {/* Prediction Charts */}
                      {(predictionsByPeriod.week?.length > 0 || predictionsByPeriod["48hours"]?.length > 0) && (
                        <div className="mt-5 grid md:grid-cols-2 gap-6">
                          {predictionsByPeriod.week?.length > 0 && (
                            <SensorChart
                              data={formatDataForChart(predictionsByPeriod.week, 'prediction_timestamp')}
                              title="Weekly AQI Predictions"
                              dataKey="aqi_prediction"
                              color="#3b82f6"
                              type="area"
                            />
                          )}
                          {predictionsByPeriod["48hours"]?.length > 0 && (
                            <SensorChart
                              data={formatDataForChart(predictionsByPeriod["48hours"], 'prediction_timestamp')}
                              title="48-Hour PM2.5 Forecast"
                              dataKey="PM2_5"
                              color="#f59e0b"
                              type="line"
                            />
                          )}
                        </div>
                      )}

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
                              <div className="text-gray-500 mb-1">Next 6H Avg AQI</div>
                              <div className="text-xl font-bold text-blue-600">{predictionAnalytics.next6hAQI}</div>
                              <div className="text-xs text-gray-400">predicted average</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">48H Peak PM2.5</div>
                              <div className="text-xl font-bold text-orange-600">{predictionAnalytics.peak48hPM25} μg/m³</div>
                              <div className="text-xs text-gray-400">forecast maximum</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Weekly Trend</div>
                              <div className="text-xl font-bold text-green-600">{predictionAnalytics.weeklyTrend}</div>
                              <div className="text-xs text-gray-400">air quality direction</div>
                            </div>
                            <div>
                              <div className="text-gray-500 mb-1">Model Confidence</div>
                              <div className="text-xl font-bold text-teal-600">{predictionAnalytics.modelConfidence}%</div>
                              <div className="text-xs text-gray-400">prediction accuracy</div>
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
                          <p className="text-lg">No prediction data available</p>
                          <p className="text-sm mt-1">AI models are processing sensor data</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </div>
  );
}