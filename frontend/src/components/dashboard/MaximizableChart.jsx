import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SensorChart from "./SensorChart";

const MaximizableChart = ({ data, title, dataKey, color, type, delay = 0 }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <>
      {/* Regular Chart Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className={isMaximized ? "hidden" : "block"}
      >
        <Card className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-gray-800 font-semibold">{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMaximize}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <SensorChart
                data={data}
                title=""
                dataKey={dataKey}
                color={color}
                type={type}
                showToolbar={false}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Maximized Chart Modal */}
      <AnimatePresence>
        {isMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={toggleMaximize}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMaximize}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 p-6">
                <SensorChart
                  data={data}
                  title=""
                  dataKey={dataKey}
                  color={color}
                  type={type}
                  showToolbar={true}
                  height="100%"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MaximizableChart;
