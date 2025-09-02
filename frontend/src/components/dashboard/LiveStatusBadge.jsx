import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveStatusBadge({ isConnected, lastUpdated }) {
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (isConnected) {
      setPulseKey(prev => prev + 1);
    }
  }, [lastUpdated, isConnected]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Badge 
        className={`flex items-center gap-2 px-3 py-1 ${
          isConnected 
            ? 'bg-green-100 text-green-800 border-green-200' 
            : 'bg-red-100 text-red-800 border-red-200'
        }`}
        variant="outline"
      >
        {isConnected ? (
          <>
            <motion.div
              key={pulseKey}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Wifi className="w-3 h-3" />
            </motion.div>
            Live
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3" />
            Offline
          </>
        )}
      </Badge>
    </motion.div>
  );
}