import React from 'react';

interface RiskMatrixProps {
  severity: number;
  likelihood: number;
  riskScore: number;
  className?: string;
}

const RiskMatrix: React.FC<RiskMatrixProps> = ({ severity, likelihood, riskScore, className = '' }) => {
  const getRiskColor = (score: number) => {
    if (score <= 4) return 'bg-green-500';
    if (score <= 8) return 'bg-yellow-500';
    if (score <= 15) return 'bg-orange-500';
    if (score <= 20) return 'bg-red-500';
    return 'bg-red-700';
  };

  const getRiskLevel = (score: number) => {
    if (score <= 4) return 'Very Low';
    if (score <= 8) return 'Low';
    if (score <= 15) return 'Medium';
    if (score <= 20) return 'High';
    return 'Very High';
  };

  const severityLabels = ['', 'Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
  const likelihoodLabels = ['', 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];

  return (
    <div className={`p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Assessment</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Severity</label>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">{severity}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {severityLabels[severity]}
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Likelihood</label>
          <div className="mt-1 flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">{likelihood}</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {likelihoodLabels[likelihood]}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Risk Level
        </label>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded ${getRiskColor(riskScore)} flex items-center justify-center`}>
            <span className="text-white font-bold text-sm">{riskScore}</span>
          </div>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {getRiskLevel(riskScore)}
          </span>
        </div>
      </div>

      {/* Risk Matrix Visual */}
      <div className="mt-4">
        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Risk Matrix</div>
        <div className="grid grid-cols-6 gap-1 text-xs">
          {/* Header */}
          <div></div>
          {[1, 2, 3, 4, 5].map(l => (
            <div key={l} className="text-center font-medium p-1 bg-gray-100 dark:bg-gray-700">
              {l}
            </div>
          ))}
          
          {/* Matrix */}
          {[5, 4, 3, 2, 1].map(s => (
            <React.Fragment key={s}>
              <div className="text-center font-medium p-1 bg-gray-100 dark:bg-gray-700">
                {s}
              </div>
              {[1, 2, 3, 4, 5].map(l => {
                const score = s * l;
                const isSelected = s === severity && l === likelihood;
                return (
                  <div
                    key={`${s}-${l}`}
                    className={`w-6 h-6 ${getRiskColor(score)} ${isSelected ? 'ring-2 ring-blue-500' : ''} flex items-center justify-center text-white font-bold`}
                  >
                    {isSelected ? '●' : ''}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskMatrix;