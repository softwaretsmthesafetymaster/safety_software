import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Timer, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../../../components/UI/Card';

interface SLACardsProps {
  stats: any;
}

const SLACards: React.FC<SLACardsProps> = ({ stats }) => {
  const slaCompliance = stats?.slaCompliance || 0;
  const avgInvestigationDuration = stats?.avgInvestigationDuration || 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                SLA Compliance
              </h3>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {slaCompliance}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  incidents closed within SLA
                </span>
              </div>
              <div className="flex items-center">
                {slaCompliance >= 80 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  slaCompliance >= 80 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {slaCompliance >= 80 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              slaCompliance >= 80 ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  slaCompliance >= 80 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(slaCompliance, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Avg Investigation Duration
              </h3>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {avgInvestigationDuration}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  days on average
                </span>
              </div>
              <div className="flex items-center">
                {avgInvestigationDuration <= 7 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-yellow-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  avgInvestigationDuration <= 7 ? 'text-green-500' : 'text-yellow-500'
                }`}>
                  {avgInvestigationDuration <= 7 ? 'Excellent' : 'Can Improve'}
                </span>
              </div>
            </div>
            <div className={`p-4 rounded-lg ${
              avgInvestigationDuration <= 7 ? 'bg-green-500' : 'bg-yellow-500'
            }`}>
              <Timer className="h-8 w-8 text-white" />
            </div>
          </div>
          
          {/* Target vs Actual */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target</p>
              <p className="font-semibold text-gray-900 dark:text-white">7 days</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actual</p>
              <p className="font-semibold text-gray-900 dark:text-white">{avgInvestigationDuration} days</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default SLACards;