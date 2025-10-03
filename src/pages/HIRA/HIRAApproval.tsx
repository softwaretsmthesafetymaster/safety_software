import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  Download,
  Send
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { approveHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

const HIRAApproval: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);

  const [comments, setComments] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleApproval = async (actionType: 'approve' | 'reject') => {
    if (!comments.trim() && actionType === 'reject') {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please provide comments for rejection'
      }));
      return;
    }

    try {
      await dispatch(approveHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        action: actionType,
        comments
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: `Assessment ${actionType}d successfully`
      }));

      navigate('/hira/assessments');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || `Failed to ${actionType} assessment`
      }));
    }
  };

  const getRiskSummary = () => {
    if (!currentAssessment?.worksheetRows) return null;

    const rows = currentAssessment.worksheetRows;
    return {
      total: rows.length,
      highRisk: rows.filter(row => ['High', 'Very High'].includes(row.riskCategory)).length,
      moderateRisk: rows.filter(row => row.riskCategory === 'Moderate').length,
      lowRisk: rows.filter(row => ['Low', 'Very Low'].includes(row.riskCategory)).length,
      significantRisks: rows.filter(row => row.significantNotSignificant === 'Significant').length,
      recommendations: rows.filter(row => row.recommendation && row.recommendation.trim() !== '').length
    };
  };

  const handleDownload = (format: 'pdf' | 'excel' | 'word') => {
    window.open(`/api/hira/${user?.companyId}/${id}/download/${format}`, '_blank');
  };

  const riskSummary = getRiskSummary();

  if (!currentAssessment) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Assessment not found
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HIRA Assessment Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve/reject the completed assessment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => handleDownload('pdf')}
          >
            Download Report
          </Button>
          <div className="relative group">
            <Button
              variant="secondary"
              icon={Download}
            >
              More Downloads
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={() => handleDownload('excel')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Download Excel
              </button>
              <button
                onClick={() => handleDownload('word')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Download Word
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Assessment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessment Number
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                  {currentAssessment.assessmentNumber}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment.title}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Plant
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment.plantId?.name}
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessment Date
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {format(new Date(currentAssessment.assessmentDate), 'MMM dd, yyyy')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed Date
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment.completedAt ? 
                    format(new Date(currentAssessment.completedAt), 'MMM dd, yyyy') : 
                    'Not completed'
                  }
                </p>
              </div>
            </div>

            {currentAssessment.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment.description}
                </p>
              </div>
            )}
          </Card>

          {/* Approval Actions */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Approval Decision
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your comments about the assessment..."
                />
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="success"
                  icon={CheckCircle}
                  loading={isLoading && action === 'approve'}
                  onClick={() => {
                    setAction('approve');
                    handleApproval('approve');
                  }}
                  className="flex-1"
                >
                  Approve Assessment
                </Button>
                
                <Button
                  variant="danger"
                  icon={XCircle}
                  loading={isLoading && action === 'reject'}
                  onClick={() => {
                    setAction('reject');
                    handleApproval('reject');
                  }}
                  className="flex-1"
                >
                  Reject Assessment
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Summary */}
          {riskSummary && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Risk Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{riskSummary.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">High Risk</span>
                  <span className="text-lg font-bold text-red-600">{riskSummary.highRisk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Moderate Risk</span>
                  <span className="text-lg font-bold text-yellow-600">{riskSummary.moderateRisk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Low Risk</span>
                  <span className="text-lg font-bold text-green-600">{riskSummary.lowRisk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Significant Risks</span>
                  <span className="text-lg font-bold text-orange-600">{riskSummary.significantRisks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recommendations</span>
                  <span className="text-lg font-bold text-blue-600">{riskSummary.recommendations}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Assessment Team */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Assessment Team
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Lead Assessor
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {currentAssessment.assessor?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentAssessment.assessor?.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {currentAssessment.assessor?.role}
                    </p>
                  </div>
                </div>
              </div>

              {currentAssessment.team && currentAssessment.team.length > 0 && (
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
        </div>
      </div>

      {/* Worksheet Preview */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Worksheet Review
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Task Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Activity/Service
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Hazard
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Significance
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {currentAssessment?.worksheetRows?.map((row: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.taskName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {row.activityService}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="font-medium">{row.hazardConcern}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {row.hazardDescription}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      row.riskScore > 15 ? 'bg-red-600 text-white' :
                      row.riskScore > 8 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {row.riskScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.riskCategory === 'Very High' ? 'bg-red-600 text-white' :
                      row.riskCategory === 'High' ? 'bg-red-100 text-red-800' :
                      row.riskCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {row.riskCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      row.significantNotSignificant === 'Significant' 
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {row.significantNotSignificant}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs truncate">
                      {row.recommendation}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default HIRAApproval;