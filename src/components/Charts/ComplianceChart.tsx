import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';

interface ComplianceChartProps {
  data: Array<{
    month: string;
    compliance: number;
    target?: number;
  }>;
  height?: number;
  showTarget?: boolean;
}

const ComplianceChart: React.FC<ComplianceChartProps> = ({ 
  data, 
  height = 300, 
  showTarget = true 
}) => {
  const formatTooltip = (value: any, name: string) => {
    if (name === 'compliance' || name === 'target') {
      return [`${value}%`, name === 'compliance' ? 'Compliance' : 'Target'];
    }
    return [value, name];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey="month" 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelStyle={{ color: '#374151' }}
            contentStyle={{ 
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="compliance" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            name="Compliance"
          />
          {showTarget && (
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#ef4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              name="Target"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default ComplianceChart;