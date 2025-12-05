import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Timer
} from 'lucide-react';
import Card from '../../../components/UI/Card';

interface KPICardsProps {
  stats: any;
}

const KPICards: React.FC<KPICardsProps> = ({ stats }) => {
  const kpiData = [
    {
      title: 'Total Incidents',
      value: stats?.total || 0,
      icon: AlertTriangle,
      color: 'bg-blue-500',
      trend: stats?.thisMonthTrend || 0,
      trendLabel: 'vs last month'
    },
    {
      title: 'Open Incidents',
      value: stats?.open || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: 5,
      trendLabel: 'pending investigation'
    },
    {
      title: 'Investigating',
      value: stats?.investigating || 0,
      icon: Users,
      color: 'bg-blue-600',
      trend: 12,
      trendLabel: 'active investigations'
    },
    {
      title: 'Closed',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: 15,
      trendLabel: 'completed this month'
    },
    {
      title: 'Critical Incidents',
      value: stats?.critical || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: -20,
      trendLabel: 'vs last month'
    },
    {
      title: 'Avg Time to Close',
      value: `${stats?.avgTimeToClose || 0}d`,
      icon: Timer,
      color: 'bg-purple-500',
      trend: -10,
      trendLabel: 'improvement'
    },
    {
      title: 'Overdue Investigations',
      value: stats?.overdue || 0,
      icon: Clock,
      color: 'bg-orange-500',
      trend: -5,
      trendLabel: 'vs last month'
    },
    {
      title: 'This Month',
      value: stats?.thisMonth || 0,
      icon: Calendar,
      color: 'bg-indigo-500',
      trend: stats?.thisMonthTrend || 0,
      trendLabel: 'new incidents'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpiData.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card hover className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {kpi.value}
                </p>
                <div className="flex items-center">
                  {kpi.trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    kpi.trend >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(kpi.trend)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    {kpi.trendLabel}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default KPICards;