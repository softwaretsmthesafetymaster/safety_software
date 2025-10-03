import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  XCircle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAAssessments } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const HIRAList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { assessments, isLoading, pagination } = useAppSelector((state) => state.hira);
  const { plants } = useAppSelector((state) => state.plant);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plantId: '',
    page: 1
  });

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchHIRAAssessments({
        companyId: user.companyId,
        ...filters
      }));
    }
  }, [dispatch, user?.companyId, filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <FileText className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'assigned':
        return <UserCheck className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'assigned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const canEdit = (assessment: any) => {
    return assessment.assessor._id === user?._id && 
           ['draft', 'rejected'].includes(assessment.status) && 
           user?.role === 'plant_head';
  };
  const canView = (assessment: any) => {
    
    return assessment.assessor._id === user?._id || 
           assessment.team?.some((member: any) => member._id === user?.id) ||
           assessment.team?.some((member: any) => member._id === user?._id) ||
           user?.role === 'plant_head';
  };

  const canWorksheet = (assessment: any) => {
    return assessment.team?.some((member: any) => member._id === user?._id) && 
           ['assigned', 'in_progress'].includes(assessment.status);
  };

  const canApprove = (assessment: any) => {
    return assessment.status === 'completed' && user?.role === 'plant_head';
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HIRA Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage hazard identification and risk assessments
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

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search assessments..."
              className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          
          <select
            className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>

          <select
            className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={filters.plantId}
            onChange={(e) => setFilters({ ...filters, plantId: e.target.value, page: 1 })}
          >
            <option value="">All Plants</option>
            {plants.map((plant) => (
              <option key={plant._id} value={plant._id}>
                {plant.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            icon={Filter}
            onClick={() => setFilters({ search: '', status: '', plantId: '', page: 1 })}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Assessments Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assessment List
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plant/Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {assessments.map((assessment, index) => (
                <motion.tr
                  key={assessment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {assessment.assessmentNumber}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {assessment.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {assessment.plantId?.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {assessment.process}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-semibold text-sm">
                          {assessment.assessor?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {assessment.assessor?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Team: {assessment.team?.length || 0} members
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(assessment.status)}`}>
                      {getStatusIcon(assessment.status)}
                      <span className="ml-1">{assessment.status.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        {assessment.riskSummary?.totalTasks || 0} tasks
                      </div>
                      <div className="text-red-600">
                        {assessment.riskSummary?.highRiskCount || 0} high risk
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {canView(assessment) && (
                      <Button
                        as={Link}
                        to={`/hira/assessments/${assessment._id}`}
                        variant="ghost"
                        icon={Eye}
                        size="sm"
                      >
                        View
                      </Button>
                    )}
                    {canEdit(assessment) && (
                      <Button
                        as={Link}
                        to={`/hira/edit/${assessment._id}`}
                        variant="ghost"
                        icon={Edit}
                        size="sm"
                      >
                        Edit
                      </Button>
                    )}
                    {canWorksheet(assessment) && (
                      <Button
                        as={Link}
                        to={`/hira/assessments/${assessment._id}/worksheet`}
                        variant="primary"
                        size="sm"
                      >
                        Worksheet
                      </Button>
                    )}
                    {canApprove(assessment) && (
                      <Button
                        as={Link}
                        to={`/hira/assessments/${assessment._id}/approve`}
                        variant="success"
                        size="sm"
                      >
                        Review
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setFilters({ ...filters, page: pagination.currentPage + 1 })}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HIRAList;