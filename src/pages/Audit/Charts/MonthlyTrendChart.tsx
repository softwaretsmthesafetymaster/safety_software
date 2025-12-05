import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ComposedChart } from 'recharts';
import { MonthlyTrendData } from '../../services/auditService';

interface MonthlyTrendProps {
  data: MonthlyTrendData[];
  type?: 'line' | 'bar' | 'combined';
  height?: number;
}

const MonthlyTrendChart: React.FC<MonthlyTrendProps> = ({ data, type = 'combined', height = 400 }) => {
  const formatTooltip = (value: any, name: string) => {
    const labels: { [key: string]: string } = {
      observations: 'Total Observations',
      compliance: 'Compliance Rate (%)',
      audits: 'Audits Completed',
      majorFindings: 'Major Findings',
      minorFindings: 'Minor Findings'
    };
    return [value, labels[name] || name];
  };

  const formatLabel = (label: string, payload: any[]) => {
    if (payload && payload.length > 0) {
      const data = payload[0].payload;
      return `${label} ${data.year}`;
    }
    return label;
  };

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={formatLabel}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="observations" 
            stroke="#EF4444" 
            strokeWidth={3}
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
            name="Observations" 
          />
          <Line 
            type="monotone" 
            dataKey="compliance" 
            stroke="#10B981" 
            strokeWidth={3}
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            name="Compliance %" 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" />
          <YAxis stroke="#6B7280" />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={formatLabel}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="observations" fill="#3B82F6" name="Observations" radius={[2, 2, 0, 0]} />
          <Bar dataKey="audits" fill="#8B5CF6" name="Audits Completed" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Combined chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="month" stroke="#6B7280" />
        <YAxis yAxisId="left" stroke="#6B7280" />
        <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
        <Tooltip 
          formatter={formatTooltip}
          labelFormatter={formatLabel}
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="majorFindings" fill="#EF4444" name="Major Findings" radius={[2, 2, 0, 0]} />
        <Bar yAxisId="left" dataKey="minorFindings" fill="#F59E0B" name="Minor Findings" radius={[2, 2, 0, 0]} />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="compliance" 
          stroke="#10B981" 
          strokeWidth={3}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          name="Compliance %" 
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default MonthlyTrendChart;