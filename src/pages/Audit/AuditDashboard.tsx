import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckSquare,
  Clock,
  Eye,
  AlertTriangle,
  TrendingUp,
  Users,
  FileText,
  Plus
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditStats } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const AuditDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { stats, isLoading } = useAppSelector((state) => state.audit);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchAuditStats(user.companyId));
    }
  }, [dispatch, user?.companyId]);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and manage safety audits across your organization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            as={Link}
            to="/audit/audits"
            variant="secondary"
            icon={Eye}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Audits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.total || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.inProgress || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Compliance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats?.avgCompliance || 0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
            </div>
                    </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <Link to={`/audit/my-actions`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Actions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(stats?.observations?.assigned || 0) + (stats?.observations?.open || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" />
              </div>
            </div>
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* Audit Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Audit Status Overview
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Planned</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.planned || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.inProgress || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Closed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.closed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.total || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Observations Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Open</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.open || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Assigned</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.assigned || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {stats?.observations?.approved || 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Audits */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Recent Audits
          </h2>
          <Button
            as={Link}
            to="/audit/audits"
            variant="secondary"
            size="sm"
          >
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Audit
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Plant
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Auditor
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Status
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Date
                </th>
                <th className="text-left py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats?.recentAudits?.map((audit: any) => (
                <tr key={audit._id}>
                  <td className="py-3">
                    <div>
                      <Link
                        to={`/audit/audits/${audit._id}`}
                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600"
                      >
                        {audit.auditNumber}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {audit.title}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white">
                    {audit.plantId?.name}
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white">
                    {audit.auditor?.name}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      audit.status === 'completed' || audit.status === 'closed' ? 'bg-green-100 text-green-800' :
                      audit.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      audit.status === 'checklist_completed' ? 'bg-purple-100 text-purple-800' :
                      audit.status === 'observations_pending' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {audit.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-900 dark:text-white">
                    {format(new Date(audit.scheduledDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-3">
                    <Button
                      as={Link}
                      to={`/audit/audits/${audit._id}`}
                      variant="secondary"
                      size="sm"
                      icon={Eye}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {(!stats?.recentAudits || stats.recentAudits.length === 0) && (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent audits</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <CheckSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            My Action Items
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View and complete observations assigned to you
          </p>
          <Button
            as={Link}
            to="/audit/my-actions"
            variant="primary"
            size="sm"
          >
            View My Actions
          </Button>
        </Card>

        {user?.role === 'plant_head' && <Card className="p-6 text-center">
          <Plus className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Manage Templates
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage templates for your plant
          </p>
          <Button
            as={Link}
            to="/audit/templates"
            variant="primary"
            size="sm"
          >
            Manage Templates
          </Button>
        </Card>}

        <Card className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            View All Audits
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Browse and manage all audits in your organization
          </p>
          <Button
            as={Link}
            to="/audit/audits"
            variant="secondary"
            size="sm"
          >
            View All Audits
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AuditDashboard;