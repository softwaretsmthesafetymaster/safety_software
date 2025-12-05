import React from 'react';
import { motion } from 'framer-motion';
import { Building, AlertTriangle, TrendingUp } from 'lucide-react';
import Card from '../../../components/UI/Card';

interface PlantSummaryProps {
  stats: any;
}

const PlantSummary: React.FC<PlantSummaryProps> = ({ stats }) => {
  const plantData = stats?.byPlant || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-8"
    >
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Plant Performance Summary
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plantData.map((plant: any, index: number) => (
            <motion.div
              key={plant._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {plant.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    plant.critical > 0 ? 'text-red-500' : 'text-green-500'
                  }`} />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {plant.critical} critical
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {plant.total}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Incidents
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {plant.open}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Open
                  </p>
                </div>
              </div>

              {/* Severity Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Severity Breakdown</span>
                </div>
                <div className="flex space-x-1 h-2 bg-gray-200 dark:bg-gray-600 rounded">
                  <div 
                    className="bg-red-500 rounded-l" 
                    style={{ width: `${(plant.critical / plant.total) * 100}%` }}
                  />
                  <div 
                    className="bg-orange-500" 
                    style={{ width: `${(plant.high / plant.total) * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-500" 
                    style={{ width: `${(plant.medium / plant.total) * 100}%` }}
                  />
                  <div 
                    className="bg-green-500 rounded-r" 
                    style={{ width: `${(plant.low / plant.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Critical: {plant.critical || 0}</span>
                  <span>High: {plant.high || 0}</span>
                  <span>Medium: {plant.medium || 0}</span>
                  <span>Low: {plant.low || 0}</span>
                </div>
              </div>

              {/* Trend */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                <span className="text-xs text-gray-500 dark:text-gray-400">This Month</span>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-500 font-medium">-15%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {plantData.length === 0 && (
          <div className="text-center py-8">
            <Building className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No plant data available
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default PlantSummary;