import React from 'react';
import { motion } from 'framer-motion';

interface RiskMatrixProps {
  data?: Array<{
    probability: number;
    severity: number;
    count: number;
    label?: string;
  }>;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onCellClick?: (probability: number, severity: number) => void;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ 
  data = [], 
  size = 'md', 
  interactive = false,
  onCellClick 
}) => {
  const severityLabels = ['Catastrophic', 'Major', 'Moderate', 'Minor', 'Negligible'];
  const probabilityLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
  
  const getRiskLevel = (probability: number, severity: number) => {
    const score = probability * severity;
    if (score >= 20) return 'very-high';
    if (score >= 15) return 'high';
    if (score >= 10) return 'medium';
    if (score >= 5) return 'low';
    return 'very-low';
  };

  const getRiskColor = (level: string) => {
    const colors = {
      'very-high': 'bg-red-600 text-white',
      'high': 'bg-red-400 text-white',
      'medium': 'bg-yellow-400 text-gray-900',
      'low': 'bg-green-400 text-white',
      'very-low': 'bg-green-600 text-white'
    };
    return colors[level] || 'bg-gray-300 text-gray-700';
  };

  const cellSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  };

  const getCellData = (probability: number, severity: number) => {
    return data.find(d => d.probability === probability && d.severity === severity);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Risk Matrix
        </h3>
        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Very Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Very High</span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Severity Label */}
        <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Severity
          </span>
        </div>

        <div className="ml-20">
          {/* Matrix Grid */}
          <div className="inline-block border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {[5, 4, 3, 2, 1].map((severity, severityIndex) => (
              <div key={severity} className="flex">
                {/* Severity Label */}
                <div className="w-20 bg-gray-100 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                    {severityLabels[severityIndex]}
                  </span>
                </div>
                
                {/* Risk Cells */}
                {[1, 2, 3, 4, 5].map((probability) => {
                  const riskLevel = getRiskLevel(probability, severity);
                  const cellData = getCellData(probability, severity);
                  
                  return (
                    <motion.div
                      key={`${severity}-${probability}`}
                      whileHover={interactive ? { scale: 1.05 } : undefined}
                      className={`${cellSizes[size]} ${getRiskColor(riskLevel)} border-r border-b border-gray-300 dark:border-gray-600 flex items-center justify-center font-semibold cursor-pointer transition-all duration-200`}
                      onClick={() => interactive && onCellClick?.(probability, severity)}
                    >
                      <div className="text-center">
                        <div>{probability * severity}</div>
                        {cellData && (
                          <div className="text-xs opacity-75">
                            ({cellData.count})
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Probability Label */}
          <div className="mt-2 flex ml-20">
            {probabilityLabels.map((label, index) => (
              <div key={index} className={`${cellSizes[size]} flex items-center justify-center`}>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center transform -rotate-45">
                  {label}
                </span>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Probability
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;