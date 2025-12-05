import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { CategoryData } from '../../services/auditService';

interface CategoryRadarProps {
  data: CategoryData[];
  height?: number;
}

const CategoryRadarChart: React.FC<CategoryRadarProps> = ({ data, height = 400 }) => {
  const formatTooltip = (value: any, name: string, props: any) => {
    const { payload } = props;
    if (name === 'observations') {
      return [
        <div key="tooltip" className="space-y-1">
          <div>Observations: {value}</div>
          <div>Compliance: {payload.compliance}%</div>
          <div>Total Questions: {payload.totalQuestions}</div>
          <div>Answered: {payload.answeredQuestions}</div>
        </div>
      ];
    }
    return [`${value}%`, 'Compliance Rate'];
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis 
            dataKey="category" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            className="text-xs"
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 'dataMax']} 
            tick={{ fontSize: 10, fill: '#6B7280' }}
          />
          <Radar 
            name="Observations" 
            dataKey="observations" 
            stroke="#EF4444" 
            fill="#EF4444" 
            fillOpacity={0.3} 
            strokeWidth={2}
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
          />
          <Radar 
            name="Compliance %" 
            dataKey="compliance" 
            stroke="#10B981" 
            fill="#10B981" 
            fillOpacity={0.2} 
            strokeWidth={2}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 3 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
          />
          <Tooltip 
            formatter={formatTooltip}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoryRadarChart;