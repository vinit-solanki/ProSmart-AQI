import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const getAQIStatus = (aqi) => {
  if (aqi <= 50) return { level: 'Good', color: 'bg-green-500', icon: CheckCircle, description: 'Air quality is satisfactory' };
  if (aqi <= 100) return { level: 'Moderate', color: 'bg-yellow-500', icon: AlertTriangle, description: 'Acceptable for most people' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: 'bg-orange-500', icon: AlertTriangle, description: 'May cause issues for sensitive people' };
  if (aqi <= 200) return { level: 'Unhealthy', color: 'bg-red-500', icon: XCircle, description: 'May cause health issues' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: 'bg-purple-500', icon: XCircle, description: 'Health warnings for everyone' };
  return { level: 'Hazardous', color: 'bg-rose-900', icon: XCircle, description: 'Emergency conditions' };
};

const AQIStatusCard = React.memo(({ currentAQI, trend }) => {
  const status = React.useMemo(() => getAQIStatus(currentAQI), [currentAQI]);
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg">
        <div className={`absolute inset-0 opacity-5 ${status.color}`} />
        
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-800 font-semibold">Air Quality Index</CardTitle>
            <Wind className="w-5 h-5 text-teal-600" />
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">{currentAQI || '--'}</div>
              <Badge className={`${status.color} text-white border-none`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.level}
              </Badge>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 text-sm">{status.description}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <div className={`text-sm ${trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% from yesterday
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${status.color} transition-all duration-1000 ease-out`}
              style={{ width: `${Math.min((currentAQI / 300) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

AQIStatusCard.displayName = 'AQIStatusCard';
export default AQIStatusCard;