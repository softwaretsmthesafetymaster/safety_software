import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Download, Eye, CreditCard as Edit, Plus, FileText, AlertTriangle, CheckCircle, Clock, UserCheck, XCircle, Target, Users, Calendar, TrendingUp, Building2, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAAssessments } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';


const HIRAList: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { assessments, isLoading, pagination } = useAppSelector((state) => state.hira);
  const { plants } = useAppSelector((state) => state.plant);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    plantId: '',
    page: 1,
    riskLevel: '',
    dateRange: ''
  });
  useEffect(() => {
    if (searchParams.get('status')  && searchParams.get('status') !== 'all') {
      setFilters({
        ...filters,
        status: searchParams.get('status')
      });
    }
    if (searchParams.get('riskLevel') && searchParams.get('riskLevel') !== 'all') {
      setFilters({
        ...filters,
        riskLevel: searchParams.get('riskLevel')
      });
    }
  }, [searchParams.get('status'), searchParams.get('riskLevel')]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      dispatch(fetchHIRAAssessments({
        companyId: user.companyId,
        ...filters
      }));
    }
  }, [dispatch, user?.companyId, filters]);

  const getStatusIcon = (status: string) => {
    const icons = {
      approved: <CheckCircle className="h-4 w-4" />,
      completed: <FileText className="h-4 w-4" />,
      in_progress: <Clock className="h-4 w-4" />,
      assigned: <UserCheck className="h-4 w-4" />,
      rejected: <XCircle className="h-4 w-4" />,
      actions_assigned: <Target className="h-4 w-4" />,
      actions_completed: <CheckCircle className="h-4 w-4" />,
      closed: <FileText className="h-4 w-4" />
    };
    return icons[status] || <FileText className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      actions_assigned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      actions_completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const canEdit = (assessment: any) => {
    return assessment.assessor._id === user?._id && 
           ['draft', 'rejected'].includes(assessment.status) && 
           (user?.role === 'admin' || user?.role === 'superadmin');
  };

  const canView = (assessment: any) => {
    return assessment.assessor._id === user?._id || 
           assessment.team?.some((member: any) => member._id === user?._id) ||
           user?.role === 'admin' || user?.role === 'superadmin';
  };

  const canWorksheet = (assessment: any) => {
    return (assessment.team?.some((member: any) => member._id === user?._id) ||
           assessment.assessor._id === user?._id) && 
           ['assigned', 'in_progress', 'rejected'].includes(assessment.status);
  };

  const canApprove = (assessment: any) => {
    return assessment.status === 'completed' &&  
           (user?.role === 'admin' || user?.role === 'superadmin' || assessment.assessor._id === user?._id);
  };

  const getRiskLevel = (assessment: any) => {
    const highRisk = assessment.riskSummary?.highRiskCount || 0;
    const totalTasks = assessment.riskSummary?.totalTasks || 0;
    if (totalTasks === 0) return 'Unknown';
    const percentage = (highRisk / totalTasks) * 100;
    if (percentage >= 50) return 'Critical';
    if (percentage >= 25) return 'High';
    if (percentage >= 10) return 'Medium';
    return 'Low';
  };

  const refreshData = () => {
    if (user?.companyId) {
      dispatch(fetchHIRAAssessments({
        companyId: user.companyId,
        ...filters
      }));
    }
  };

  if (isLoading && !assessments.length) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              HIRA Assessments
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage hazard identification and risk assessments ({assessments.length} total)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="ghost"
              icon={RefreshCw}
              onClick={refreshData}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button
                as={Link}
                to="/hira/create"
                variant="primary"
                icon={Plus}
                className="w-full sm:w-auto"
              >
                New Assessment
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Assessments', value: assessments.length, color: 'bg-blue-500', icon: FileText },
            { label: 'In Progress', value: assessments.filter(a => a.status === 'in_progress').length, color: 'bg-yellow-500', icon: Clock },
            { label: 'Approved', value: assessments.filter(a => a.status === 'approved').length, color: 'bg-green-500', icon: CheckCircle },
            { label: 'High Risk Items', value: assessments.reduce((sum, a) => sum + (a.riskSummary?.highRiskCount || 0), 0), color: 'bg-red-500', icon: AlertTriangle }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                Advanced Filters
              </Button>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <option value="actions_assigned">Actions Assigned</option>
              <option value="actions_completed">Actions Completed</option>
              <option value="closed">Closed</option>
            </select>

            {user?.role === 'admin' || user?.role === 'superadmin' && <select
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
            </select>}

            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => setFilters({ search: '', status: '', plantId: '', page: 1, riskLevel: '', dateRange: '' })}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>

          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <select
                    className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value, page: 1 })}
                  >
                    <option value="">All Risk Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  
                  <select
                    className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value, page: 1 })}
                  >
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Content */}
        {viewMode === 'table' ? (
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
                      Plant/Process
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {assessments.map((assessment, index) => {
                    const riskLevel = getRiskLevel(assessment);
                    const progress = assessment.riskSummary?.totalTasks > 0 ? 
                      Math.round((assessment.riskSummary.totalTasks - (assessment.actionsSummary?.openActions || 0)) / assessment.riskSummary.totalTasks * 100) : 0;
                    
                    return (
                      <motion.tr
                        key={assessment._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => canView(assessment) && navigate(`/hira/assessments/${assessment._id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {assessment.assessmentNumber}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {assessment.title}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                              <Building2 className="h-4 w-4 mr-1" />
                              {assessment.plantId?.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {assessment.process}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex -space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                                <span className="text-white font-semibold text-xs">
                                  {assessment.assessor?.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              {assessment.team?.slice(0, 2).map((member: any, idx: number) => (
                                <div key={member._id} className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                                  <span className="text-white font-semibold text-xs">
                                    {member.name?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              ))}
                              {assessment.team && assessment.team.length > 2 && (
                                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                                  <span className="text-gray-700 dark:text-gray-300 font-semibold text-xs">
                                    +{assessment.team.length - 2}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {(assessment.team?.length || 0) + 1} members
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                            {getStatusIcon(assessment.status)}
                            <span className="ml-1">{assessment.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                              riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                              riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {riskLevel}
                            </span>
                            <div className="text-xs text-gray-500">
                              {assessment.riskSummary?.highRiskCount || 0} high risk
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-white w-10 text-right">
                              {progress}%
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {canView(assessment) && (
                              <Button
                                variant="ghost"
                                icon={Eye}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/hira/assessments/${assessment._id}`);
                                }}
                              />
                            )}
                            {canEdit(assessment) && (
                              <Button
                                variant="ghost"
                                icon={Edit}
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/hira/edit/${assessment._id}`);
                                }}
                              />
                            )}
                            {canWorksheet(assessment) && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/hira/assessments/${assessment._id}/worksheet`);
                                }}
                              >
                                Worksheet
                              </Button>
                            )}
                            {canApprove(assessment) && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/hira/assessments/${assessment._id}/approve`);
                                }}
                              >
                                Review
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.map((assessment, index) => {
              const riskLevel = getRiskLevel(assessment);
              const progress = assessment.riskSummary?.totalTasks > 0 ? 
                Math.round((assessment.riskSummary.totalTasks - (assessment.actionsSummary?.openActions || 0)) / assessment.riskSummary.totalTasks * 100) : 0;
              
              return (
                <motion.div
                  key={assessment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full"
                    onClick={() => canView(assessment) && navigate(`/hira/assessments/${assessment._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                          {assessment.assessmentNumber}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {assessment.title}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {getStatusIcon(assessment.status)}
                        <span className="ml-1">{assessment.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Building2 className="h-4 w-4 mr-2" />
                        {assessment.plantId?.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(assessment.assessmentDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Users className="h-4 w-4 mr-2" />
                          {(assessment.team?.length || 0) + 1} members
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          riskLevel === 'Critical' ? 'bg-red-100 text-red-800' :
                          riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                          riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {riskLevel} Risk
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                          <span className="text-white font-semibold text-xs">
                            {assessment.assessor?.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {assessment.team?.slice(0, 2).map((member: any) => (
                          <div key={member._id} className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                            <span className="text-white font-semibold text-xs">
                              {member.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {canWorksheet(assessment) && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/hira/assessments/${assessment._id}/worksheet`);
                            }}
                          >
                            Worksheet
                          </Button>
                        )}
                        {canApprove(assessment) && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/hira/assessments/${assessment._id}/approve`);
                            }}
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {assessments.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assessments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {filters.search || filters.status || filters.plantId
                ? "No assessments match your current filters."
                : "Get started by creating your first HIRA assessment."
              }
            </p>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <Button
                as={Link}
                to="/hira/create"
                variant="primary"
                icon={Plus}
              >
                Create Assessment
              </Button>
            )}
          </Card>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.currentPage === 1}
                  onClick={() => setFilters({ ...filters, page: pagination.currentPage - 1 })}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setFilters({ ...filters, page })}
                        className={`px-3 py-1 text-sm rounded ${
                          pagination.currentPage === page
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
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
          </Card>
        )}
      </div>
    </div>
  );
};

export default HIRAList;