import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchBBSStats, fetchBBSReports } from '../../store/slices/bbsSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const BBSDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, reports } = useAppSelector((state) => state.bbs);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchBBSStats(user.companyId));
      dispatch(fetchBBSReports({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  const observationTypeData = [
    { name: 'Unsafe Acts', value: stats?.unsafeActs || 0, color: '#ef4444' },
    { name: 'Unsafe Conditions', value: stats?.unsafeConditions || 0, color: '#f59e0b' },
    { name: 'Safe Behaviors', value: stats?.safeBehaviors || 0, color: '#10b981' },
  ];

  const monthlyTrends = [
    { month: 'Jan', unsafe_acts: 25, unsafe_conditions: 18, safe_behaviors: 42 },
    { month: 'Feb', unsafe_acts: 22, unsafe_conditions: 15, safe_behaviors: 48 },
    { month: 'Mar', unsafe_acts: 28, unsafe_conditions: 20, safe_behaviors: 45 },
    { month: 'Apr', unsafe_acts: 20, unsafe_conditions: 12, safe_behaviors: 52 },
    { month: 'May', unsafe_acts: 18, unsafe_conditions: 10, safe_behaviors: 58 },
    { month: 'Jun', unsafe_acts: 15, unsafe_conditions: 8, safe_behaviors: 62 },
  ];

  const severityData = [
    { severity: 'Low', count: 45 },
    { severity: 'Medium', count: 28 },
    { severity: 'High', count: 15 },
    { severity: 'Critical', count: 5 },
  ];

  const dashboardStats = [
    {
      title: 'Total Observations',
      value: stats?.total || 0,
      icon: Eye,
      color: 'bg-blue-500',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Open Items',
      value: stats?.open || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Closed Items',
      value: stats?.closed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+25%',
      trendUp: true,
    },
    {
      title: 'Safe Behaviors',
      value: stats?.safeBehaviors || 0,
      icon: Users,
      color: 'bg-purple-500',
      trend: '+32%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Behavior Based Safety Observation Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/bbs/observations"
            variant="secondary"
            icon={Eye}
          >
            View All Observations
          </Button>
          <Button
            as={Link}
            to="/bbs/observations/new"
            variant="primary"
            icon={Plus}
          >
            New Observation
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
        {/* Observation Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observation Types
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={observationTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {observationTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Monthly Trends */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="unsafe_acts" stroke="#ef4444" strokeWidth={2} name="Unsafe Acts" />
                <Line type="monotone" dataKey="unsafe_conditions" stroke="#f59e0b" strokeWidth={2} name="Unsafe Conditions" />
                <Line type="monotone" dataKey="safe_behaviors" stroke="#10b981" strokeWidth={2} name="Safe Behaviors" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Severity Distribution & Recent Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Severity Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Recent Observations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Observations
              </h3>
              <Link
                to="/bbs/observations"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {reports?.slice(0, 5).map((report, index) => (
                <div key={report._id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-full ${
                    report.observationType === 'safe_behavior' ? 'bg-green-100 text-green-600' :
                    report.observationType === 'unsafe_act' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {report.observationType === 'safe_behavior' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/bbs/observations/${report._id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {report.reportNumber}
                    </Link>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        report.severity === 'critical' ? 'bg-red-100 text-red-800' :
                        report.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                        report.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {report.severity}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(report.observationDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    report.status === 'closed' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {report.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 text-blue-500 mr-2" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-200">85%</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Safe Behavior Rate</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+5% from last month</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">92%</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Observation Closure Rate</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Within target</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">156</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Active Observers</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">+12 this month</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-orange-900 dark:text-orange-200">3.2</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Avg Response Time</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Days to closure</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default BBSDashboard;