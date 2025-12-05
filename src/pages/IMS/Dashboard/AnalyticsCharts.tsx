import React from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { BarChart3, TrendingUp, User } from 'lucide-react';
import Card from '../../../components/UI/Card';

interface AnalyticsChartsProps {
  stats: any;
  incidents: any[];
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ stats, incidents }) => {
  // Root Cause Distribution Data
  const rootCauseData = stats?.rootCauseDistribution || [
    { category: 'Human Error', count: 35 },
    { category: 'Equipment', count: 28 },
    { category: 'Procedure', count: 20 },
    { category: 'Environment', count: 12 },
    { category: 'Behavior', count: 15 },
    { category: 'Other', count: 8 }
  ];

  // Body Part Injuries Data
  const bodyPartData = stats?.bodyPartInjuries || [
    { part: 'Hand', count: 25 },
    { part: 'Back', count: 18 },
    { part: 'Eye', count: 12 },
    { part: 'Foot', count: 15 },
    { part: 'Head', count: 8 },
    { part: 'Leg', count: 10 }
  ];

  // Monthly Trends Data
  const monthlyTrends = stats?.monthlyTrends || [
    { month: 'Jan', new: 15, closed: 12, investigating: 8, slaCompliant: 85 },
    { month: 'Feb', new: 18, closed: 15, investigating: 10, slaCompliant: 82 },
    { month: 'Mar', new: 12, closed: 18, investigating: 6, slaCompliant: 90 },
    { month: 'Apr', new: 20, closed: 16, investigating: 12, slaCompliant: 78 },
    { month: 'May', new: 14, closed: 20, investigating: 8, slaCompliant: 88 },
    { month: 'Jun', new: 16, closed: 14, investigating: 10, slaCompliant: 86 }
  ];

  // Severity Trends Data
  const severityTrends = stats?.severityTrends || [
    { month: 'Jan', critical: 2, high: 5, medium: 6, low: 2 },
    { month: 'Feb', critical: 3, high: 7, medium: 5, low: 3 },
    { month: 'Mar', critical: 1, high: 4, medium: 5, low: 2 },
    { month: 'Apr', critical: 4, high: 8, medium: 6, low: 2 },
    { month: 'May', critical: 2, high: 5, medium: 5, low: 2 },
    { month: 'Jun', critical: 3, high: 6, medium: 5, low: 2 }
  ];

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Cause & Injury Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Root Cause Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Root Cause Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rootCauseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                >
                  {rootCauseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Body Part Injuries */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Body Part Injury Distribution
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bodyPartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="part" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Incident Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Incident Trends
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  stroke="#ef4444" 
                  strokeWidth={2} 
                  name="New Incidents" 
                />
                <Line 
                  type="monotone" 
                  dataKey="closed" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  name="Closed" 
                />
                <Line 
                  type="monotone" 
                  dataKey="investigating" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  name="Under Investigation" 
                />
                <Line 
                  type="monotone" 
                  dataKey="slaCompliant" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                  name="SLA Compliant %" 
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Severity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Severity Trends
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="critical" stackId="a" fill="#dc2626" name="Critical" />
                <Bar dataKey="high" stackId="a" fill="#ea580c" name="High" />
                <Bar dataKey="medium" stackId="a" fill="#d97706" name="Medium" />
                <Bar dataKey="low" stackId="a" fill="#059669" name="Low" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;