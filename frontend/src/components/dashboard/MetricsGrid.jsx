import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity,
  Zap,
  Gauge
} from "lucide-react";
import { motion } from "framer-motion";

const MetricCard = React.memo(({ title, value, unit, icon: Icon, color, trend, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {value !== undefined ? `${value}${unit}` : '--'}
        </div>
        {trend !== undefined && (
          <div className={`text-xs flex items-center gap-1 mt-1 ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            <span>{trend >= 0 ? '↗' : '↘'}</span>
            {Math.abs(trend)}% 24h
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
));

MetricCard.displayName = 'MetricCard';

const MetricsGrid = React.memo(({ sensorData, historicalData = [] }) => {
  
  // Function to calculate 24-hour trend for a specific sensor
  const calculateTrend = React.useCallback((sensorKey) => {
    if (!sensorData || !historicalData.length) return 0;
    
    const current = sensorData[sensorKey] || 0;
    const currentTime = new Date(sensorData.timestamp);
    const twentyFourHoursAgo = new Date(currentTime.getTime() - (24 * 60 * 60 * 1000));
    
    // Find data point closest to 24 hours ago
    let previousValue = null;
    let closestTimeDiff = Infinity;
    
    for (let i = 0; i < historicalData.length; i++) {
      const dataTime = new Date(historicalData[i]?.timestamp);
      const timeDiff = Math.abs(dataTime.getTime() - twentyFourHoursAgo.getTime());
      
      if (timeDiff < closestTimeDiff) {
        closestTimeDiff = timeDiff;
        previousValue = historicalData[i][sensorKey] || 0;
      }
    }
    
    if (!previousValue || previousValue === 0) return 0;
    return ((current - previousValue) / previousValue * 100).toFixed(1);
  }, [sensorData, historicalData]);
  
  const metrics = React.useMemo(() => [
    {
      title: "Temperature",
      value: typeof sensorData?.TEMP === 'number' ? sensorData.TEMP.toFixed(1) : undefined,
      unit: "°C",
      icon: Thermometer,
      color: "text-orange-500",
      trend: parseFloat(calculateTrend('TEMP'))
    },
    {
      title: "PM2.5",
      value: typeof sensorData?.PM2_5 === 'number' ? sensorData.PM2_5.toFixed(2) : undefined,
      unit: "μg/m³",
      icon: Wind,
      color: "text-purple-500",
      trend: parseFloat(calculateTrend('PM2_5'))
    },
    {
      title: "CO",
      value: typeof sensorData?.CO === 'number' ? sensorData.CO.toFixed(2) : undefined,
      unit: "ppm",
      icon: Activity,
      color: "text-green-500",
      trend: parseFloat(calculateTrend('CO'))
    },
    {
      title: "NO2",
      value: typeof sensorData?.NO2 === 'number' ? sensorData.NO2.toFixed(2) : undefined,
      unit: "ppb",
      icon: Zap,
      color: "text-yellow-500", 
      trend: parseFloat(calculateTrend('NO2'))
    },
    {
      title: "O3",
      value: typeof sensorData?.O3 === 'number' ? sensorData.O3.toFixed(2) : undefined,
      unit: "ppb",
      icon: Gauge,
      color: "text-red-500",
      trend: parseFloat(calculateTrend('O3'))
    },
    {
      title: "PM10",
      value: typeof sensorData?.PM10 === 'number' ? sensorData.PM10.toFixed(2) : undefined,
      unit: "μg/m³",
      icon: Wind,
      color: "text-indigo-500",
      trend: parseFloat(calculateTrend('PM10'))
    }
  ], [sensorData, calculateTrend]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={`${metric.title}-${index}`}
          {...metric}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
});

MetricsGrid.displayName = 'MetricsGrid';
export default MetricsGrid;