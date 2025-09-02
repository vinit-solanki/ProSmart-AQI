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

const MetricsGrid = React.memo(({ sensorData }) => {
  const metrics = React.useMemo(() => [
    {
      title: "Temperature",
      value: sensorData?.temperature?.toFixed(1),
      unit: "°C",
      icon: Thermometer,
      color: "text-orange-500",
      trend: 2.1
    },
    {
      title: "Humidity", 
      value: sensorData?.humidity?.toFixed(1),
      unit: "%",
      icon: Droplets,
      color: "text-blue-500",
      trend: -0.8
    },
    {
      title: "PM2.5",
      value: sensorData?.PM2_5?.toFixed(2),
      unit: "μg/m³",
      icon: Wind,
      color: "text-purple-500",
      trend: 5.2
    },
    {
      title: "VOCs",
      value: sensorData?.VOCs?.toFixed(2),
      unit: "ppb",
      icon: Activity,
      color: "text-green-500",
      trend: -1.3
    },
    {
      title: "CO2",
      value: sensorData?.CO2?.toFixed(0),
      unit: "ppm",
      icon: Zap,
      color: "text-yellow-500", 
      trend: 3.7
    },
    {
      title: "NOx",
      value: sensorData?.NOx?.toFixed(2),
      unit: "ppb",
      icon: Gauge,
      color: "text-red-500",
      trend: 1.9
    }
  ], [sensorData]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.title}
          {...metric}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
});

MetricsGrid.displayName = 'MetricsGrid';
export default MetricsGrid;