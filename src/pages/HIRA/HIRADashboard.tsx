import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAStats, fetchHIRAAssessments } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const HIRADashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, assessments } = useAppSelector((state) => state.hira);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchHIRAStats(user.companyId));
      dispatch(fetchHIRAAssessments({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  const riskData = [
    { name: 'Very High', value: 8, color: '#dc2626' },
    { name: 'High', value: 15, color: '#ef4444' },
    { name: 'Moderate', value: 32, color: '#f59e0b' },
    { name: 'Low', value: 28, color: '#10b981' },
    { name: 'Very Low', value: 17, color: '#6b7280' },
  ];

  const hazardCategoryData = [
    { category: 'Chemical', count: 45 },
    { category: 'Physical', count: 38 },
    { category: 'Biological', count: 12 },
    { category: 'Ergonomic', count: 25 },
    { category: 'Psychosocial', count: 8 },
  ];

  const dashboardStats = [
    {
      title: 'Total Assessments',
      value: stats?.total || 0,
      icon: Target,
      color: 'bg-blue-500',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+22%',
      trendUp: true,
    },
    {
      title: 'High Risk Items',
      value: stats?.highRiskItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-12%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HIRA Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hazard Identification & Risk Assessment Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/hira/assessments"
            variant="secondary"
            icon={Target}
          >
            View All Assessments
          </Button>
          <Button
            as={Link}
            to="/hira/assessments/new"
            variant="primary"
            icon={Plus}
          >
            New HIRA Assessment
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hover className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 ${
                      stat.trendUp ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className={`text-sm ml-1 ${
                      stat.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {stat.trend}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Level Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Level Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Hazard Categories */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hazard Categories
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hazardCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Recent Assessments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent HIRA Assessments
            </h3>
            <Link
              to="/hira/assessments"
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assessment Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Assessor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assessments?.slice(0, 5).map((assessment) => (
                  <tr key={assessment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/hira/assessments/${assessment._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {assessment.assessmentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {assessment.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {assessment.plantId?.name} • {assessment.area}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        assessment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        assessment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        assessment.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assessment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {assessment.assessor?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Risk Matrix & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Matrix Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk Matrix Summary
            </h3>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {/* Risk matrix visualization */}
              {[5, 4, 3, 2, 1].map((severity) => (
                <div key={severity} className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5].map((probability) => {
                    const riskScore = severity * probability;
                    const riskColor = 
                      riskScore >= 20 ? 'bg-red-500' :
                      riskScore >= 15 ? 'bg-orange-500' :
                      riskScore >= 10 ? 'bg-yellow-500' :
                      riskScore >= 5 ? 'bg-blue-500' :
                      'bg-green-500';
                    
                    return (
                      <div
                        key={`${severity}-${probability}`}
                        className={`w-8 h-8 ${riskColor} rounded text-white text-xs flex items-center justify-center font-semibold`}
                      >
                        {riskScore}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Low Probability</span>
              <span>High Probability</span>
            </div>
            <div className="flex flex-col items-start mt-2">
              <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-90 origin-left">
                High Severity
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400 transform -rotate-90 origin-left mt-16">
                Low Severity
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Action Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Action Items Requiring Attention
            </h3>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-red-900 dark:text-red-200">12</p>
                    <p className="text-sm text-red-700 dark:text-red-300">Very High Risk Items</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Require immediate action</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-orange-900 dark:text-orange-200">25</p>
                    <p className="text-sm text-orange-700 dark:text-orange-300">High Risk Items</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">Need control measures</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">8</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Pending Reviews</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Awaiting approval</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default HIRADashboard;