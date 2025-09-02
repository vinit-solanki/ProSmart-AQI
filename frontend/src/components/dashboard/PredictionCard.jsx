import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const PredictionCard = React.memo(({ prediction, period, delay = 0 }) => {
  const getConfidenceColor = React.useCallback((confidence) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  }, []);

  const formatPeriod = React.useCallback((period) => {
    const periodMap = {
      "6hours": "Next 6 Hours",
      "48hours": "Next 48 Hours", 
      "15days": "Next 15 Days",
      "week": "Next Week"
    };
    return periodMap[period] || period;
  }, []);

  const formattedPeriod = React.useMemo(() => formatPeriod(period), [formatPeriod, period]);
  const confidenceColor = React.useMemo(() => 
    prediction?.confidence_score ? getConfidenceColor(prediction.confidence_score) : "", 
    [prediction?.confidence_score, getConfidenceColor]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              {formattedPeriod}
            </CardTitle>
            {prediction?.confidence_score && (
              <Badge className={`${confidenceColor} text-white border-none`}>
                {prediction.confidence_score}% confidence
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-gray-500 text-sm">Predicted AQI</div>
              <div className="text-2xl font-bold text-gray-900">
                {prediction?.aqi_prediction?.toFixed(0) || '--'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-gray-500 text-sm">PM2.5</div>
              <div className="text-xl font-semibold text-orange-600">
                {prediction?.PM2_5?.toFixed(1) || '--'} μg/m³
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-gray-500">CO2</div>
              <div className="text-yellow-600 font-semibold">
                {prediction?.CO2?.toFixed(0) || '--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">VOCs</div>
              <div className="text-green-600 font-semibold">
                {prediction?.VOCs?.toFixed(2) || '--'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500">NOx</div>
              <div className="text-red-600 font-semibold">
                {prediction?.NOx?.toFixed(2) || '--'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="text-gray-600 text-sm">
              Forecast for {prediction?.prediction_timestamp ? new Date(prediction.prediction_timestamp).toLocaleDateString() : '--'}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});

PredictionCard.displayName = 'PredictionCard';
export default PredictionCard;