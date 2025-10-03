import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHAZOPStats, fetchHAZOPStudies } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

const HAZOPDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, studies } = useAppSelector((state) => state.hazop);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchHAZOPStats(user.companyId));
      dispatch(fetchHAZOPStudies({ companyId: user.companyId, limit: 5 }));
    }
  }, [dispatch, user?.companyId]);

  // Calculate real risk data from studies
  const riskData = studies?.reduce((acc: any[], study) => {
    study.nodes?.forEach((node: any) => {
      node.worksheets?.forEach((worksheet: any) => {
        const existing = acc.find(item => item.name === worksheet.risk);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ 
            name: worksheet.risk?.replace('_', ' ').toUpperCase() || 'Unknown', 
            value: 1,
            color: worksheet.risk === 'very_high' ? '#dc2626' :
                   worksheet.risk === 'high' ? '#ef4444' :
                   worksheet.risk === 'medium' ? '#f59e0b' :
                   worksheet.risk === 'low' ? '#10b981' : '#6b7280'
          });
        }
      });
    });
    return acc;
  }, []) || [];

  // Calculate methodology distribution from studies
  const methodologyData = studies?.reduce((acc: any[], study) => {
    const existing = acc.find(item => item.method === study.methodology);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ method: study.methodology, count: 1 });
    }
    return acc;
  }, []) || [];

  const dashboardStats = [
    {
      title: 'Total Studies',
      value: stats?.total || 0,
      icon: Search,
      color: 'bg-blue-500',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Completed',
      value: stats?.completed || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: 'High Risk Items',
      value: stats?.highRiskItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-5%',
      trendUp: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HAZOP Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Hazard and Operability Studies Management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/hazop/studies"
            variant="secondary"
            icon={Search}
          >
            View All Studies
          </Button>
          <Button
            as={Link}
            to="/hazop/studies/new"
            variant="primary"
            icon={Plus}
          >
            New HAZOP Study
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
        {/* Risk Distribution */}
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

        {/* Methodology Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Study Methodologies
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={methodologyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Recent Studies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent HAZOP Studies
            </h3>
            <Link
              to="/hazop/studies"
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
                    Study Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Facilitator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {studies?.slice(0, 5).map((study) => (
                  <tr key={study._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/hazop/studies/${study._id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        {study.studyNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {study.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {study.plantId?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        study.status === 'completed' ? 'bg-green-100 text-green-800' :
                        study.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        study.status === 'planned' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {study.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {study.facilitator?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(study.createdAt), 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Action Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Action Items Requiring Attention
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-red-900 dark:text-red-200">8</p>
                  <p className="text-sm text-red-700 dark:text-red-300">Overdue recommendations</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Past target date</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">3</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Studies pending review</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Awaiting approval</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-blue-900 dark:text-blue-200">5</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Sessions scheduled</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">This week</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default HAZOPDashboard;