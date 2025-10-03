import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit,
  Download,
  Users,
  FileText,
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Send,
  XCircle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAById, assignHIRA, downloadHIRA } from '../../store/slices/hiraSlice';
import { DownloadService } from '../../services/hira/downloadService';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import DownloadButton from '../../components/DownloadButton';
import axios from 'axios';

const HIRADetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

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

  const canEdit = () => {
    return currentAssessment?.assessor._id === user?.id && 
           ['draft', 'rejected'].includes(currentAssessment.status) && 
           user?.role === 'plant_head';
  };

  const canAssign = () => {
    return currentAssessment?.status === 'draft' && user?.role === 'plant_head';
  };

  const canWorksheet = () => {
    return (currentAssessment?.team?.some((member: any) => member._id === user?.id) ||
           currentAssessment?.team?.some((member: any) => member._id === user?._id)) && 
           ['assigned', 'in_progress'].includes(currentAssessment.status);
  };

  const canApprove = () => {
    return currentAssessment?.status === 'completed' && user?.role === 'plant_head';
  };

  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    await DownloadService.download(format, currentAssessment);
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentAssessment) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          HIRA assessment not found
        </h3>
        <Button
          as={Link}
          to="/hira/assessments"
          variant="primary"
          className="mt-4"
        >
          Back to Assessments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentAssessment.assessmentNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAssessment.status)}`}>
              {getStatusIcon(currentAssessment.status)}
              <span className="ml-1">{currentAssessment.status.replace('_', ' ').toUpperCase()}</span>
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAssessment.plantId?.name} • {currentAssessment.process}
          </p>
        </div>
        <div className="flex items-center space-x-3">
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
            >
              Review & Approve
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assessment Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Assessment Overview
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment.title}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plant
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAssessment.plantId?.name} ({currentAssessment.plantId?.code})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Process
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAssessment.process}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assessment Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.assessmentDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                {currentAssessment.reviewDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Review Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(currentAssessment.reviewDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              {currentAssessment.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAssessment.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Risk Summary */}
          {currentAssessment.worksheetRows && currentAssessment.worksheetRows.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Risk Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentAssessment.riskSummary?.totalTasks || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {currentAssessment.riskSummary?.highRiskCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {currentAssessment.riskSummary?.moderateRiskCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Moderate Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentAssessment.riskSummary?.lowRiskCount || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentAssessment.riskSummary?.significantRisks || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Significant</div>
                </div>
              </div>
            </Card>
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
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lead Assessor
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Members ({currentAssessment.team.length})
                  </label>
                  <div className="space-y-2">
                    {currentAssessment.team.map((member: any) => (
                      <div key={member._id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
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
                  className="w-full"
                  icon={Edit}
                >
                  Edit Assessment
                </Button>
              )}
              
              {canAssign() && (
                <Button
                  as={Link}
                  to={`/hira/assessments/${id}/assign`}
                  variant="primary"
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                  icon={CheckCircle}
                >
                  Review & Approve
                </Button>
              )}
              
              {currentAssessment.status === 'approved' && user?.role === 'plant_head' && (
                <Button
                  as={Link}
                  to={`/hira/assessments/${id}/close`}
                  variant="secondary"
                  className="w-full"
                  icon={FileText}
                >
                  Close Assessment
                </Button>
              )}
            </div>
          </Card>

          {/* Assessment Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Assessment Timeline
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentAssessment.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              
              {currentAssessment.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Assigned:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.assignedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              {currentAssessment.startedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Started:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.startedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              {currentAssessment.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.completedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              {currentAssessment.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Approved:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.approvedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
              
              {currentAssessment.closedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Closed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(currentAssessment.closedAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HIRADetails;