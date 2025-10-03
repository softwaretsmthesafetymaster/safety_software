import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitStats, fetchPermits } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const PermitDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, permits } = useAppSelector((state) => state.permit);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchPermitStats(user.companyId));
      dispatch(fetchPermits({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  // Real data from backend
  const statusData = [
    { name: 'Active', value: stats?.active || 0, color: '#10b981' },
    { name: 'Pending', value: stats?.pending || 0, color: '#f59e0b' },
    { name: 'Expired', value: stats?.expired || 0, color: '#ef4444' },
    { name: 'Closed', value: stats?.closed || 0, color: '#6b7280' },
  ];

  // Calculate permit type distribution from recent permits
  const permitTypeData = permits?.reduce((acc: any[], permit) => {
    permit.types?.forEach((type: string) => {
      const existing = acc.find(item => item.type === type);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ type: type.replace('_', ' ').toUpperCase(), count: 1 });
      }
    });
    return acc;
  }, []) || [];

  const dashboardStats = [
    {
      title: 'Total Permits',
      value: stats?.total || 0,
      icon: FileText,
      color: 'bg-blue-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Active Permits',
      value: stats?.active || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'Pending Approval',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Expired',
      value: stats?.expired || 0,
      icon: XCircle,
      color: 'bg-red-500',
      trend: '-3%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permit to Work Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and monitor work permits across your facility
          </p>
        </div>
        

<div className="flex items-center space-x-3">
  <Link to="/ptw/permits">
    <Button variant="secondary" icon={FileText}>
      View All Permits
    </Button>
  </Link>

  <Link to="/ptw/permits/new">
    <Button variant="primary" icon={Plus}>
      New Permit
    </Button>
  </Link>
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
        {/* Permit Types */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Permit Types Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={permitTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Recent Permits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Permits
            </h3>
            <Link
              to="/ptw/permits"
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
                    Permit Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Work Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requested By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {permits?.slice(0, 5).map((permit) => (
                  <tr key={permit._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/ptw/permits/${permit._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {permit.permitNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {permit.workDescription}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {permit.types?.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        permit.status === 'active' ? 'bg-green-100 text-green-800' :
                        permit.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        permit.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        permit.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {permit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(permit.schedule?.startDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {permit.requestedBy?.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Urgent Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Urgent Actions Required
          </h3>
          <div className="space-y-3">
            {[
              {
                message: '3 permits expiring within 24 hours',
                type: 'warning',
                action: 'Review & Extend'
              },
              {
                message: '2 permits pending safety approval',
                type: 'info',
                action: 'Approve Now'
              },
              {
                message: '1 permit overdue for closure',
                type: 'error',
                action: 'Close Permit'
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    item.type === 'warning' ? 'bg-yellow-400' :
                    item.type === 'error' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`} />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {item.message}
                  </span>
                </div>
                <Button size="sm" variant={item.type === 'error' ? 'danger' : 'primary'}>
                  {item.action}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default PermitDashboard; 