import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../services/audit/reportService';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || '/api';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Download, 
  CheckSquare, 
  Users, 
  Calendar, 
  FileText, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditById, startAudit } from '../../store/slices/auditSlice';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';

const AuditDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);
  const [observations, setObservations] = useState<any[]>([]);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
      fetchObservations();
    }
  }, [dispatch, id, user?.companyId]);

  const fetchObservations = async () => {
    if (!user?.companyId || !id) return;
    
    try {
      const response = await axios.get(`${API_URL}/observations/${user.companyId}/audit/${id}`);
      const data = await response.data;
      setObservations(data.observations || []);
    } catch (error) {
      console.error('Failed to fetch observations:', error);
    }
  };

  const handleStartAudit = async () => {
    if (!user?.companyId || !id) return;
    
    try {
      await dispatch(startAudit({ companyId: user.companyId, id })).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Audit started successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to start audit'
      }));
    }
  };

  const downloadReport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!user?.companyId || !id) return;
    await reportService.downloadAuditReport({ format, auditId: id, companyId: user.companyId });
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentAudit) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Audit not found
        </h3>
        <Button
          as={Link}
          to="/audit/audits"
          variant="primary"
          className="mt-4"
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'checklist_completed':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'observations_pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'in_progress':
      case 'checklist_completed':
      case 'observations_pending':
        return Clock;
      case 'planned':
        return Calendar;
      case 'closed':
        return FileText;
      default:
        return FileText;
    }
  };

  const StatusIcon = getStatusIcon(currentAudit.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate('/audit/audits')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentAudit.auditNumber}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentAudit.status)}`}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {currentAudit.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              {currentAudit.title}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {currentAudit.status === 'planned' && (
            <>
              <Button
                as={Link}
                to={`/audit/audits/${id}/edit`}
                variant="secondary"
                icon={Edit}
              >
                Edit
              </Button>
              <Button
                variant="primary"
                icon={Play}
                onClick={handleStartAudit}
              >
                Start Audit
              </Button>
            </>
          )}
          
          {(currentAudit.status === 'completed' || currentAudit.status === 'closed') && (
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport('pdf')}
              >
                PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport('excel')}
              >
                Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => downloadReport('word')}
              >
                Word
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audit Overview */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Audit Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Audit Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standard
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.standard}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plant
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.plantId?.name} ({currentAudit.plantId?.code})
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Scheduled Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(currentAudit.scheduledDate), 'MMMM dd, yyyy')}
                  </p>
                </div>
                {currentAudit.actualDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actual Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {format(new Date(currentAudit.actualDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Lead Auditor
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentAudit.auditor?.name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scope
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                {currentAudit.scope}
              </p>
            </div>
          </Card>

          {/* Audit Team */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Audit Team
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {currentAudit.auditor?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentAudit.auditor?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lead Auditor • {currentAudit.auditor?.email}
                  </p>
                </div>
              </div>

              {currentAudit.auditTeam && currentAudit.auditTeam.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Team Members ({currentAudit.auditTeam.length})
                  </h3>
                  {currentAudit.auditTeam.map((member: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {member.member?.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.member?.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {member.role} • {member.member?.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentAudit.auditee && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Primary Auditee
                  </h3>
                  <div className="flex items-center space-x-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {currentAudit.auditee?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentAudit.auditee?.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {currentAudit.auditee?.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Areas to be Audited */}
          {currentAudit.areas && currentAudit.areas.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Areas to be Audited
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentAudit.areas.map((area: any, index: number) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {area.name}
                    </p>
                    {area.inCharge && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        In-charge: {area.inCharge?.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Compliance Summary */}
          {currentAudit.summary && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Compliance Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentAudit.summary.totalQuestions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {currentAudit.summary.yesAnswers || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Yes</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {currentAudit.summary.noAnswers || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">No</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {currentAudit.summary.naAnswers || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">N/A</div>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(currentAudit.summary.compliancePercentage || 0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Compliance</div>
                </div>
              </div>
            </Card>
          )}

          {/* Observations Summary */}
          {observations.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Observations ({observations.length})
              </h2>
              <div className="space-y-3">
                {observations.slice(0, 5).map((obs: any) => (
                  <div key={obs._id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {obs.observationNumber}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          obs.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                          obs.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          obs.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {obs.riskLevel.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {obs.observation.length > 100 ? `${obs.observation.substring(0, 100)}...` : obs.observation}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      obs.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                      obs.status === 'approved' ? 'bg-green-100 text-green-800' :
                      obs.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      obs.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      obs.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {obs.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
                
                {observations.length > 5 && (
                  <div className="text-center pt-4">
                    <Button
                      as={Link}
                      to={`/audit/audits/${id}/manage`}
                      variant="secondary"
                      size="sm"
                    >
                      View All {observations.length} Observations
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {currentAudit.status === 'planned' && (
                <Button
                  variant="primary"
                  className="w-full"
                  icon={Play}
                  onClick={handleStartAudit}
                >
                  Start Audit
                </Button>
              )}
              
              {(currentAudit.status === 'in_progress' || currentAudit.status === 'checklist_completed') && (
                <Button
                  as={Link}
                  to={`/audit/audits/${id}/checklist`}
                  variant="primary"
                  className="w-full"
                  icon={CheckSquare}
                >
                  {currentAudit.status === 'in_progress' ? 'Start Checklist' : 'Continue Checklist'}
                </Button>
              )}
              
              {(currentAudit.status === 'checklist_completed' || currentAudit.status === 'observations_pending') && (
                <>
                  <Button
                    as={Link}
                    to={`/audit/audits/${id}/observations`}
                    variant="primary"
                    className="w-full"
                    icon={AlertTriangle}
                  >
                    Add Observations
                  </Button>
                  <Button
                    as={Link}
                    to={`/audit/audits/${id}/manage`}
                    variant="secondary"
                    className="w-full"
                    icon={Settings}
                  >
                    Manage Observations
                  </Button>
                </>
              )}
              {(currentAudit.status === "checklist_completed" || currentAudit.status === "observations_pending") && (
                <Button
                  as={Link}
                  to='/audit/my-actions'
                  variant="secondary"
                  className="w-full"
                  icon={Settings}
                >
                  My Actions
                </Button>
              )}
              {currentAudit.status === 'completed' && (
                <Button
                  as={Link}
                  to={`/audit/audits/${id}/close`}
                  variant="success"
                  className="w-full"
                  icon={CheckCircle}
                >
                  Close Audit
                </Button>
              )}
              
              <Button
                variant="secondary"
                className="w-full"
                icon={Download}
                onClick={() => downloadReport('pdf')}
                disabled={currentAudit.status === 'planned'}
              >
                Download Report
              </Button>
            </div>
          </Card>

          {/* Audit Progress */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Progress Tracking
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['in_progress', 'checklist_completed', 'observations_pending', 'completed', 'closed'].includes(currentAudit.status)
                    ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Audit Started
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentAudit.actualDate ? format(new Date(currentAudit.actualDate), 'MMM dd, yyyy') : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['checklist_completed', 'observations_pending', 'completed', 'closed'].includes(currentAudit.status)
                    ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Checklist Completed
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentAudit.checklistCompletedAt ? format(new Date(currentAudit.checklistCompletedAt), 'MMM dd, yyyy') : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['completed', 'closed'].includes(currentAudit.status)
                    ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Observations Completed
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentAudit.observationsCompletedAt ? format(new Date(currentAudit.observationsCompletedAt), 'MMM dd, yyyy') : 'Pending'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentAudit.status === 'closed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Audit Closed
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {currentAudit.closedAt ? format(new Date(currentAudit.closedAt), 'MMM dd, yyyy') : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Audit Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Audit Details
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentAudit.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Standard:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentAudit.standard}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentAudit.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Observations:</span>
                <span className="text-gray-900 dark:text-white">
                  {observations.length}
                </span>
              </div>
              {currentAudit.summary?.compliancePercentage !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Compliance:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {Math.round(currentAudit.summary.compliancePercentage)}%
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

export default AuditDetails;