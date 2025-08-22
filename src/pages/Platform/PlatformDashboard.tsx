import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Globe
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchCompanies } from '../../store/slices/companySlice';
import Card from '../../components/UI/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const PlatformDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { companies } = useAppSelector((state) => state.company);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  // Mock data for platform-level analytics
  const revenueData = [
    { month: 'Jan', revenue: 45000, companies: 12 },
    { month: 'Feb', revenue: 52000, companies: 15 },
    { month: 'Mar', revenue: 48000, companies: 18 },
    { month: 'Apr', revenue: 61000, companies: 22 },
    { month: 'May', revenue: 55000, companies: 25 },
    { month: 'Jun', revenue: 67000, companies: 28 },
  ];

  const moduleUsageData = [
    { name: 'PTW', usage: 85, color: '#3b82f6' },
    { name: 'IMS', usage: 78, color: '#ef4444' },
    { name: 'HAZOP', usage: 65, color: '#8b5cf6' },
    { name: 'HIRA', usage: 72, color: '#f59e0b' },
    { name: 'BBS', usage: 58, color: '#10b981' },
    { name: 'Audit', usage: 69, color: '#6b7280' },
  ];

  const industryData = [
    { industry: 'Manufacturing', count: 12 },
    { industry: 'Oil & Gas', count: 8 },
    { industry: 'Chemical', count: 6 },
    { industry: 'Construction', count: 4 },
    { industry: 'Mining', count: 3 },
  ];

  const platformStats = [
    {
      title: 'Total Companies',
      value: companies.length,
      icon: Building,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Users',
      value: '2,847',
      icon: Users,
      color: 'bg-green-500',
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Monthly Revenue',
      value: '$67,000',
      icon: DollarSign,
      color: 'bg-purple-500',
      trend: '+22%',
      trendUp: true,
    },
    {
      title: 'System Uptime',
      value: '99.9%',
      icon: Activity,
      color: 'bg-emerald-500',
      trend: '+0.1%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Platform Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor platform-wide metrics and company performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
            <Globe className="inline h-4 w-4 mr-1" />
            All Systems Operational
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {platformStats.map((stat, index) => (
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
        {/* Revenue & Growth */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue & Company Growth
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="right" dataKey="companies" fill="#3b82f6" name="Companies" />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Revenue ($)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Module Usage */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Module Usage Across Platform
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={moduleUsageData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                <Bar dataKey="usage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Industry Distribution & Company List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Industry Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ industry, count }) => `${industry}: ${count}`}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Recent Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Companies
            </h3>
            <div className="space-y-4">
              {companies.slice(0, 6).map((company, index) => (
                <Link
                  key={company._id}
                  to={`/platform/companies/${company._id}/config`}
                 
                  >
                    <div key={company._id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {company.industry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      company.subscription.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {company.subscription.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {company.subscription.plan}
                    </span>
                  </div>
                </div>
                  </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* System Health & Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="h-5 w-5 text-green-500 mr-2" />
            System Health & Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-200">99.9%</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Uptime</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Last 30 days</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">2.3s</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Avg Response Time</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Global average</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">156TB</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Data Processed</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">This month</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-orange-900 dark:text-orange-200">3</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Active Alerts</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Require attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default PlatformDashboard;   