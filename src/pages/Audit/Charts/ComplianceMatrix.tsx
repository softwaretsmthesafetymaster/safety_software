import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { ComplianceData } from '../../services/auditService';

interface ComplianceMatrixProps {
  data: ComplianceData[];
  height?: number;
}

const ComplianceMatrix: React.FC<ComplianceMatrixProps> = ({ data, height = 400 }) => {
  // Normalize department name (your backend sometimes sends _id.areaName)
  const normalizedData = data.map(item => ({
    ...item,
    department: item.department || item._id?.areaName || "Unknown"
  }));

  const getComplianceColor = (compliance: number) => {
    // if (compliance >= 90) return '#10B981'; // green
    // if (compliance >= 75) return '#F59E0B'; // yellow
    return '#10B981'; // red
  };

  const formatTooltip = (value: any, name: string) => {
    const map: any = {
      major: "Major Findings",
      minor: "Minor Findings",
      total: "Total Findings",
      compliance: "Compliance %"
    };

    return [
      name === "compliance" ? `${value}%` : value,
      map[name] || name
    ];
  };

  const formatLabel = (label: string) =>
    label.length > 15 ? `${label.substring(0, 15)}...` : label;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={normalizedData}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

          <XAxis
            dataKey="department"
            angle={-20}
            textAnchor="end"
            height={80}
            fontSize={12}
            tickFormatter={formatLabel}
            stroke="#6B7280"
          />
          <YAxis stroke="#6B7280" />

          <Tooltip
            formatter={formatTooltip}
            labelFormatter={(label) => `Department: ${label}`}
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />

          {/* Findings stack */}
          <Bar dataKey="major" stackId="findings" fill="#EF4444" name="Major Findings" />
          <Bar dataKey="minor" stackId="findings" fill="#F59E0B" name="Minor Findings" />

          {/* Compliance % as separate bar */}
          <Bar dataKey="compliance" name="Compliance %" fill='#10B981' />

        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComplianceMatrix;
