import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  description?: string;
  subValue?: string;
  onClick?: () => void;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  description,
  subValue,
  onClick,
  loading = false
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    
    switch (trend.direction) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : undefined}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          
          {loading ? (
            <div className="mt-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          )}
          
          {trend && !loading && (
            <div className="flex items-center mt-2">
              {getTrendIcon()}
              <span className={`text-sm ml-1 ${getTrendColor()}`}>
                {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">{trend.period}</span>
            </div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
          
          {subValue && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {subValue}
            </p>
          )}
        </div>
        
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricCard;