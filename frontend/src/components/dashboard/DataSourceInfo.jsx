import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function DataSourceInfo({ metadata }) {
  if (!metadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {metadata.data_sources?.map((source, index) => (
              <Badge 
                key={index}
                className="bg-blue-100 text-blue-800 border-blue-300"
                variant="outline"
              >
                <Cpu className="w-3 h-3 mr-1" />
                {source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            ))}
          </div>
          {metadata.last_updated && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>Last system update: {new Date(metadata.last_updated).toLocaleString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}