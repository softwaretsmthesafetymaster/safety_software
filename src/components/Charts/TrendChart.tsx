import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

interface TrendChartProps {
  data: Array<{
    [key: string]: any;
  }>;
  xAxisKey: string;
  lines?: Array<{
    key: string;
    name: string;
    color: string;
    type?: 'line' | 'bar';
  }>;
  height?: number;
  chartType?: 'line' | 'bar' | 'combo';
}

const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  xAxisKey,
  lines = [],
  height = 300,
  chartType = 'line'
}) => {
  const formatTooltip = (value: any, name: string) => {
    const line = lines.find(l => l.key === name);
    return [value, line?.name || name];
  };

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
          <XAxis 
            dataKey={xAxisKey} 
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
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
          {lines.map((line, index) => (
            <Bar 
              key={line.key}
              dataKey={line.key} 
              fill={line.color}
              name={line.name}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      );
    }

    return (
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
        <XAxis 
          dataKey={xAxisKey} 
          stroke="#6b7280"
          fontSize={12}
        />
        <YAxis 
          stroke="#6b7280"
          fontSize={12}
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
        {lines.map((line, index) => (
          <Line 
            key={line.key}
            type="monotone" 
            dataKey={line.key} 
            stroke={line.color} 
            strokeWidth={3}
            dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
            name={line.name}
          />
        ))}
      </LineChart>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </motion.div>
  );
};

export default TrendChart;