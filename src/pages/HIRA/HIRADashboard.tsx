import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  TrendingUp,
  AlertTriangle,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  XCircle,
  UserCheck
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAStats } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';

const HIRADashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, isLoading } = useAppSelector((state) => state.hira);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchHIRAStats(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  const statCards = [
    {
      title: 'Total Assessments',
      value: stats?.totalAssessments || 0,
      icon: FileText,
      color: 'bg-blue-500',
      trend: '+12%'
    },
    {
      title: 'In Progress',
      value: stats?.inProgressAssessments || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      trend: '+5%'
    },
    {
      title: 'Completed',
      value: stats?.completedAssessments || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      trend: '+8%'
    },
    {
      title: 'High Risk Items',
      value: stats?.highRiskItems || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      trend: '-3%'
    },
    {
      title: 'Assigned',
      value: stats?.assignedAssessments || 0,
      icon: UserCheck,
      color: 'bg-purple-500',
      trend: '+2%'
    },
    {
      title: 'Approved',
      value: stats?.approvedAssessments || 0,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      trend: '+15%'
    },
    {
      title: 'Rejected',
      value: stats?.rejectedAssessments || 0,
      icon: XCircle,
      color: 'bg-red-600',
      trend: '-8%'
    },
    {
      title: 'Closed',
      value: stats?.closedAssessments || 0,
      icon: FileText,
      color: 'bg-gray-500',
      trend: '+10%'
    }
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
            Hazard Identification & Risk Assessment Overview
          </p>
        </div>
        {user?.role === 'plant_head' && (
          <Button
            as={Link}
            to="/hira/create"
            variant="primary"
            icon={Plus}
          >
            New Assessment
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">{stat.trend}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                  from last month
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Assessments
            </h2>
            <Link 
              to="/hira/assessments"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recentAssessments?.slice(0, 5).map((assessment, index) => (
              <div key={assessment._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {assessment.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {assessment.plantId?.name} • {assessment.assessor?.name}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  assessment.status === 'approved' 
                    ? 'bg-green-100 text-green-800'
                    : assessment.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : assessment.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {assessment.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Distribution
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Very High</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">High</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Moderate</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <span className="text-sm font-medium">35%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Low</span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {user?.role === 'plant_head' && (
            <>
              <Button
                as={Link}
                to="/hira/create"
                variant="primary"
                icon={Plus}
                className="w-full"
              >
                Create Assessment
              </Button>
              <Button
                as={Link}
                to="/hira/assessments?status=completed"
                variant="secondary"
                icon={CheckCircle}
                className="w-full"
              >
                Pending Approvals
              </Button>
            </>
          )}
          <Button
            as={Link}
            to="/hira/assessments?status=assigned"
            variant="secondary"
            icon={UserCheck}
            className="w-full"
          >
            Assigned to Me
          </Button>
          <Button
            as={Link}
            to="/hira/assessments?status=in_progress"
            variant="secondary"
            icon={Clock}
            className="w-full"
          >
            In Progress
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HIRADashboard;