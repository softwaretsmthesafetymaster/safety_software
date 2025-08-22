import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  CheckSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditStats, fetchAudits } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const AuditDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, audits } = useAppSelector((state) => state.audit);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchAuditStats(user.companyId));
      dispatch(fetchAudits({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  const auditTypeData = [
    { name: 'Internal', value: 45, color: '#3b82f6' },
    { name: 'External', value: 25, color: '#10b981' },
    { name: 'Regulatory', value: 20, color: '#f59e0b' },
    { name: 'Management', value: 10, color: '#8b5cf6' },
  ];

  const complianceData = [
    { month: 'Jan', compliance: 85 },
    { month: 'Feb', compliance: 88 },
    { month: 'Mar', compliance: 82 },
    { month: 'Apr', compliance: 90 },
    { month: 'May', compliance: 92 },
    { month: 'Jun', compliance: 95 },
  ];

  const findingTypeData = [
    { type: 'Non-Compliance', count: 25 },
    { type: 'Observation', count: 45 },
    { type: 'Opportunity', count: 18 },
  ];

  const dashboardStats = [
    {
      title: 'Total Audits',
      value: stats?.total || 0,
      icon: CheckSquare,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Planned',
      value: stats?.planned || 0,
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
      trend: '+18%',
      trendUp: true,
    },
    {
      title: 'Avg Compliance',
      value: `${Math.round(stats?.avgCompliance || 0)}%`,
      icon: BarChart3,
      color: 'bg-purple-500',
      trend: '+3%',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Safety Audit Management & Compliance Tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/audit/audits"
            variant="secondary"
            icon={CheckSquare}
          >
            View All Audits
          </Button>
          <Button
            as={Link}
            to="/audit/audits/new"
            variant="primary"
            icon={Plus}
          >
            New Audit
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
        {/* Audit Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audit Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={auditTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {auditTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Compliance Trends */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compliance Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => [`${value}%`, 'Compliance']} />
                <Line type="monotone" dataKey="compliance" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Finding Types & Recent Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Finding Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Finding Types
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={findingTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Recent Audits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Audits
              </h3>
              <Link
                to="/audit/audits"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {audits?.slice(0, 5).map((audit, index) => (
                <div key={audit._id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className={`p-2 rounded-full ${
                    audit.status === 'completed' ? 'bg-green-100 text-green-600' :
                    audit.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/audit/audits/${audit._id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {audit.auditNumber}
                    </Link>
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {audit.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        audit.type === 'internal' ? 'bg-blue-100 text-blue-800' :
                        audit.type === 'external' ? 'bg-green-100 text-green-800' :
                        audit.type === 'regulatory' ? 'bg-orange-100 text-orange-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {audit.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(audit.scheduledDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    audit.status === 'completed' ? 'bg-green-100 text-green-800' :
                    audit.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {audit.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Compliance Score & Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-green-500 mr-2" />
            Compliance Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-200">95%</p>
                  <p className="text-sm text-green-700 dark:text-green-300">Overall Compliance</p>
                  <p className="text-xs text-green-600 dark:text-green-400">+3% from last quarter</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">12</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Active Audits</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">In progress</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-orange-900 dark:text-orange-200">8</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300">Open Findings</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Require action</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-200">25</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Certified Auditors</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Available</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuditDashboard;