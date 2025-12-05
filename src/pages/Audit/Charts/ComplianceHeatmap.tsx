import React from 'react';
import { HeatmapData } from '../../services/auditService';

interface ComplianceHeatmapProps {
  data: HeatmapData[];
  clauseHeaders: string[];
}

const ComplianceHeatmap: React.FC<ComplianceHeatmapProps> = ({ data, clauseHeaders }) => {
  const getHeatmapColor = (value: number) => {
    if (value === 0) return 'bg-green-100 text-green-800 border-green-200';
    if (value === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (value === 2) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (value >= 3 && value <= 5) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-red-200 text-red-900 border-red-300';
  };

  const getIntensity = (value: number) => {
    if (value === 0) return '';
    if (value === 1) return 'font-medium';
    if (value === 2) return 'font-semibold';
    return 'font-bold';
  };

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="sticky left-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-50">
              Department
            </th>
            {clauseHeaders.map((clause) => (
              <th 
                key={clause} 
                className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[60px]"
                title={`Clause ${clause}`}
              >
                <div className="transform -rotate-45 whitespace-nowrap">
                  {clause}
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => {
            const total = Object.values(row.clauses).reduce((sum, val) => sum + val, 0);
            return (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200 bg-white">
                  <div className="max-w-[150px] truncate" title={row.areaName}>
                    {row.areaName}
                  </div>
                </td>
                {clauseHeaders.map((clause) => {
                  const value = row.clauses[clause] || 0;
                  return (
                    <td 
                      key={clause} 
                      className={`px-2 py-3 text-center text-sm border-r border-gray-200 transition-all hover:scale-110 ${getHeatmapColor(value)} ${getIntensity(value)}`}
                      title={`${row.areaName} - Clause ${clause}: ${value} findings`}
                    >
                      {value || ''}
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 bg-gray-50">
                  {total}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Legend */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">0 (Compliant)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">1 (Minor)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-gray-600">2 (Moderate)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">3-5 (Major)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-200 border border-red-300 rounded"></div>
            <span className="text-gray-600">5+ (Critical)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceHeatmap;