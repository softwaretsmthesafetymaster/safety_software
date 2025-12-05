import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import { ClauseData } from '../../services/auditService';

interface ClauseComplianceProps {
  data: ClauseData[];
  height?: number;
}

const ClauseComplianceChart: React.FC<ClauseComplianceProps> = ({ data, height = 400 }) => {
  const getComplianceColor = (compliance: number) => {
    if (compliance >= 90) return '#10B981'; // green
    if (compliance >= 75) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    const { payload } = props;
    if (name === 'total') {
      return [
        <div key="tooltip" className="space-y-1">
          <div>Total Findings: {value}</div>
          <div>Major: {payload.major}</div>
          <div>Minor: {payload.minor}</div>
          <div>Compliance: {payload.compliance}%</div>
          <div>Element: {payload.element}</div>
          <div>Standard: {payload.standard}</div>
        </div>
      ];
    }
    return [value, name];
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="clause" 
            angle={-90}
            textAnchor="end"
            height={100}
            fontSize={10}
            stroke="#6B7280"
          />
          <YAxis stroke="#6B7280" />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(label) => `Clause: ${label}`}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              minWidth: '200px'
            }}
          />
          <Legend />
          <Bar 
            dataKey="total" 
            fill="#3B82F6" 
            name="Total Non-Conformances"
            radius={[2, 2, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getComplianceColor(entry.compliance)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ClauseComplianceChart;