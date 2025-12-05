import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard as Edit, Download, Users, FileText, Target, CheckCircle, Clock, AlertTriangle, UserCheck, Send, XCircle, Calendar, Building2, TrendingUp, Activity, Eye } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import DownloadButton from '../../components/DownloadButton';
import { DownloadService } from '../../services/hira/downloadService';

const HIRADetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'worksheet' | 'actions' | 'timeline'>('overview');

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);
  
  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    await DownloadService.download(format, currentAssessment);
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      approved: <CheckCircle className="h-5 w-5" />,
      completed: <FileText className="h-5 w-5" />,
      in_progress: <Clock className="h-5 w-5" />,
      assigned: <UserCheck className="h-5 w-5" />,
      rejected: <XCircle className="h-5 w-5" />,
      actions_assigned: <Target className="h-5 w-5" />,
      actions_completed: <CheckCircle className="h-5 w-5" />,
      closed: <FileText className="h-5 w-5" />
    };
    return icons[status] || <FileText className="h-5 w-5" />;
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

  const canEdit = () => {
    return currentAssessment?.assessor._id === user?._id && 
           ['draft', 'rejected'].includes(currentAssessment.status) && 
           (currentAssessment?.createdBy === user?._id || user?.role === 'superadmin');
  };

  const canWorksheet = () => {
    return (currentAssessment?.team?.some((member: any) => member._id === user?._id) ||
           currentAssessment?.assessor._id === user?._id) && 
           ['assigned', 'in_progress', 'rejected'].includes(currentAssessment.status);
  };

  const canApprove = () => {
    return currentAssessment?.status === 'completed' && 
           currentAssessment?.assessor._id === user?._id;
  };

  const canManageActions = () => {
    return ['approved', 'actions_assigned','closed'].includes(currentAssessment?.status) &&
           (currentAssessment?.createdBy === user?._id || user?.role === 'superadmin' || currentAssessment?.assessor._id === user?._id ||
            currentAssessment?.team?.some((member: any) => member._id === user?._id));
  };

  
  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Assessment not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The HIRA assessment you're looking for doesn't exist or has been removed.
          </p>
          <Button
            as={Link}
            to="/hira/assessments"
            variant="primary"
          >
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  const riskSummary = currentAssessment.riskSummary || {};
  const actionsSummary = currentAssessment.actionsSummary || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                {currentAssessment.assessmentNumber}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAssessment.status)}`}>
                {getStatusIcon(currentAssessment.status)}
                <span className="ml-1">{currentAssessment.status.replace('_', ' ').toUpperCase()}</span>
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {currentAssessment.title}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-1" />
                {currentAssessment.plantId?.name}
              </div>
              <div className="flex items-center">
                <Activity className="h-4 w-4 mr-1" />
                {currentAssessment.process}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(currentAssessment.assessmentDate), 'MMM dd, yyyy')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
            <DownloadButton
              handleExport={handleDownload}
            />
          </div>
            
            {canWorksheet() && (
              <Button
                as={Link}
                to={`/hira/assessments/${id}/worksheet`}
                variant="primary"
                icon={Target}
                className="w-full sm:w-auto"
              >
                Open Worksheet
              </Button>
            )}
            
            {canApprove() && (
              <Button
                as={Link}
                to={`/hira/assessments/${id}/approve`}
                variant="success"
                icon={CheckCircle}
                className="w-full sm:w-auto"
              >
                Review & Approve
              </Button>
            )}
            
            {canManageActions() && (
              <Button
                as={Link}
                to={`/hira/assessments/${id}/actions`}
                variant="primary"
                icon={Target}
                className="w-full sm:w-auto"
              >
                Manage Actions
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Total Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskSummary.totalTasks || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-green-600 font-medium">Completed</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    High Risk
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {riskSummary.highRiskCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Requires immediate attention
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Action Items
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {actionsSummary.totalActions || 0}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-2 text-xs">
                <span className="text-green-600 font-medium">{actionsSummary.completedActions || 0} completed</span>
                <span className="text-gray-400 mx-1">•</span>
                <span className="text-red-600 font-medium">{actionsSummary.openActions || 0} open</span>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Significant Risks
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {riskSummary.significantRisks || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Critical for business
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <Card className="p-1">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'worksheet', label: 'Worksheet', icon: FileText },
              { id: 'actions', label: 'Actions', icon: Target },
              { id: 'timeline', label: 'Timeline', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Assessment Overview
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{currentAssessment.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Process</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{currentAssessment.process}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Plant</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {currentAssessment.plantId?.name} ({currentAssessment.plantId?.code})
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assessment Date</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {format(new Date(currentAssessment.assessmentDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {currentAssessment.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{currentAssessment.description}</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Risk Distribution Chart */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Very High', count: riskSummary.veryHighRiskCount || 0, color: 'bg-red-600', lightColor: 'bg-red-100' },
                      { label: 'High', count: riskSummary.highRiskCount || 0, color: 'bg-orange-500', lightColor: 'bg-orange-100' },
                      { label: 'Moderate', count: riskSummary.moderateRiskCount || 0, color: 'bg-yellow-500', lightColor: 'bg-yellow-100' },
                      { label: 'Low', count: riskSummary.lowRiskCount || 0, color: 'bg-green-500', lightColor: 'bg-green-100' },
                      { label: 'Very Low', count: riskSummary.veryLowRiskCount || 0, color: 'bg-blue-500', lightColor: 'bg-blue-100' }
                    ].map((risk) => {
                      const percentage = riskSummary.totalTasks ? (risk.count / riskSummary.totalTasks * 100).toFixed(1) : '0';
                      return (
                        <div key={risk.label} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded ${risk.color}`}></div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{risk.label}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${risk.color}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                              {risk.count} ({percentage}%)
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'worksheet' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Worksheet Data</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hazard</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Risk</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Controls</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {currentAssessment.worksheetRows?.map((row: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {row.taskName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              <div>{row.hazardConcern}</div>
                              <div className="text-xs text-gray-500 mt-1">{row.hazardDescription}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                row.riskCategory === 'Very High' ? 'bg-red-100 text-red-800' :
                                row.riskCategory === 'High' ? 'bg-orange-100 text-orange-800' :
                                row.riskCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                row.riskCategory === 'Low' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {row.riskCategory} ({row.riskScore})
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {row.existingRiskControl}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {row.recommendation}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'actions' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Action Items</h3>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                      <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{actionsSummary.openActions || 0}</div>
                        <div className="text-sm text-red-700 dark:text-red-300">Open</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{actionsSummary.inProgressActions || 0}</div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">In Progress</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{actionsSummary.completedActions || 0}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{actionsSummary.overdueActions || 0}</div>
                        <div className="text-sm text-orange-700 dark:text-orange-300">Overdue</div>
                      </div>
                    </div>
                    
                    {canManageActions() && (
                      <div className="text-center">
                        <Button
                          as={Link}
                          to={`/hira/assessments/${id}/actions`}
                          variant="primary"
                          icon={Target}
                        >
                          Manage Action Items
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'timeline' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Assessment Timeline</h3>
                  
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {[
                        { key: 'createdAt', label: 'Created', icon: FileText, color: 'bg-blue-500' },
                        { key: 'assignedAt', label: 'Assigned', icon: UserCheck, color: 'bg-purple-500' },
                        { key: 'startedAt', label: 'Started', icon: Clock, color: 'bg-yellow-500' },
                        { key: 'completedAt', label: 'Completed', icon: CheckCircle, color: 'bg-blue-500' },
                        { key: 'approvedAt', label: 'Approved', icon: CheckCircle, color: 'bg-green-500' },
                        { key: 'actionsAssignedAt', label: 'Actions Assigned', icon: Target, color: 'bg-orange-500' },
                        { key: 'actionsCompletedAt', label: 'Actions Completed', icon: CheckCircle, color: 'bg-emerald-500' },
                        { key: 'closedAt', label: 'Closed', icon: FileText, color: 'bg-gray-500' }
                      ].map((item, index, array) => {
                        const date = currentAssessment[item.key];
                        if (!date) return null;
                        
                        return (
                          <li key={item.key}>
                            <div className="relative pb-8">
                              {index !== array.length - 1 && (
                                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full ${item.color} flex items-center justify-center ring-8 ring-white dark:ring-gray-900`}>
                                    <item.icon className="h-4 w-4 text-white" />
                                  </span>
                                </div>
                                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white font-medium">{item.label}</p>
                                  </div>
                                  <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                                    {format(new Date(date), 'MMM dd, yyyy HH:mm')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      }).filter(Boolean)}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assessment Team */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Assessment Team
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lead Assessor
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {currentAssessment?.assessor?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentAssessment?.assessor?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {currentAssessment?.assessor?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {currentAssessment?.team && currentAssessment.team.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Team Members ({currentAssessment.team.length})
                    </label>
                    <div className="space-y-3">
                      {currentAssessment.team.map((member: any) => (
                        <div key={member._id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {member.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {member.role}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                {canEdit() && (
                  <Button
                    as={Link}
                    to={`/hira/edit/${id}`}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={Edit}
                  >
                    Edit Assessment
                  </Button>
                )}
                
                {currentAssessment.status === 'draft' && user?.role === 'admin' && (
                  <Button
                    as={Link}
                    to={`/hira/assessments/${id}/assign`}
                    variant="primary"
                    className="w-full justify-start"
                    icon={Send}
                  >
                    Assign to Team
                  </Button>
                )}
                
                {canWorksheet() && (
                  <Button
                    as={Link}
                    to={`/hira/assessments/${id}/worksheet`}
                    variant="primary"
                    className="w-full justify-start"
                    icon={Target}
                  >
                    Complete Worksheet
                  </Button>
                )}
                
                {canApprove() && (
                  <Button
                    as={Link}
                    to={`/hira/assessments/${id}/approve`}
                    variant="success"
                    className="w-full justify-start"
                    icon={CheckCircle}
                  >
                    Review & Approve
                  </Button>
                )}
                
                {canManageActions() && (
                  <Button
                    as={Link}
                    to={`/hira/assessments/${id}/actions`}
                    variant="primary"
                    className="w-full justify-start"
                    icon={Target}
                  >
                    Manage Actions
                  </Button>
                )}
                
                {currentAssessment.status === 'actions_completed' && (user?.role === 'admin' || currentAssessment.assessor._id === user?._id) && (
                  <Button
                    as={Link}
                    to={`/hira/assessments/${id}/close`}
                    variant="secondary"
                    className="w-full justify-start"
                    icon={FileText}
                  >
                    Close Assessment
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIRADetails;