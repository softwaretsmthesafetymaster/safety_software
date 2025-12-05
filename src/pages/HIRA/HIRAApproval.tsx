import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  AlertTriangle,
  Users,
  Clock,
  Download,
  Send,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  TrendingUp,
  Building2,
  Calendar,
  Target
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { approveHIRAAssessment, fetchHIRAById, downloadHIRA } from '../../store/slices/hiraSlice';
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
  const [rating, setRating] = useState(0);
  const [showWorksheetDetails, setShowWorksheetDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'worksheet' | 'risks'>('overview');

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    await dispatch(downloadHIRA({
      companyId: user?.companyId!,
      id: id!,
      format
    }));
  };

  const handleApproval = async (actionType: 'approve' | 'reject') => {
    if (!comments.trim()) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please provide comments for your decision'
      }));
      return;
    }

    if (actionType === 'approve' && rating === 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please provide a quality rating for approval'
      }));
      return;
    }

    try {
      await dispatch(approveHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        action: actionType,
        comments,
        rating
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
      veryHighRisk: rows.filter(row => row.riskCategory === 'Very High').length,
      highRisk: rows.filter(row => row.riskCategory === 'High').length,
      moderateRisk: rows.filter(row => row.riskCategory === 'Moderate').length,
      lowRisk: rows.filter(row => row.riskCategory === 'Low').length,
      veryLowRisk: rows.filter(row => row.riskCategory === 'Very Low').length,
      significantRisks: rows.filter(row => row.significantNotSignificant === 'Significant').length,
      recommendations: rows.filter(row => row.recommendation && 
        (Array.isArray(row.recommendation) ? row.recommendation.some(r => r.trim()) : row.recommendation.trim())).length
    };
  };

  const getCompletionScore = () => {
    if (!currentAssessment?.worksheetRows?.length) return 0;
    
    const rows = currentAssessment.worksheetRows;
    let totalScore = 0;
    let maxScore = 0;

    rows.forEach(row => {
      maxScore += 7; // 7 key fields to check
      if (row.taskName) totalScore++;
      if (row.activityService) totalScore++;
      if (row.hazardConcern) totalScore++;
      if (row.hazardDescription) totalScore++;
      if (row.existingRiskControl) totalScore++;
      if (row.recommendation) totalScore++;
      if (row.riskScore > 0) totalScore++;
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const riskSummary = getRiskSummary();
  const completionScore = getCompletionScore();

  if (!currentAssessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Assessment not found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The assessment you're trying to review doesn't exist or has been removed.
          </p>
          <Button
            variant="primary"
            onClick={() => navigate('/hira/assessments')}
          >
            Back to Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              HIRA Assessment Review
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Review and approve/reject the completed assessment
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Assessment: {currentAssessment.assessmentNumber}</span>
              <span>•</span>
              <span>Submitted: {format(new Date(currentAssessment.completedAt), 'MMM dd, yyyy')}</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            
          </div>
        </motion.div>

        {/* Quality Metrics */}
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
                    Completion Score
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {completionScore}%
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionScore}%` }}
                />
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
                    Total Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskSummary?.total || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                All tasks completed
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
                    High Risk Items
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {(riskSummary?.veryHighRisk || 0) + (riskSummary?.highRisk || 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-red-600">
                Requires attention
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
                    Recommendations
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {riskSummary?.recommendations || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-purple-600">
                Action items identified
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <Card className="p-1">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'worksheet', label: 'Worksheet Review', icon: FileText },
              { id: 'risks', label: 'Risk Analysis', icon: AlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </Card>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Assessment Details
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
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
                            Process
                          </label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {currentAssessment.process}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Plant
                          </label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                            <Building2 className="h-4 w-4 mr-1" />
                            {currentAssessment.plantId?.name}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Assessment Date
                          </label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(currentAssessment.assessmentDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Completed Date
                          </label>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {currentAssessment.completedAt ? 
                              format(new Date(currentAssessment.completedAt), 'MMM dd, yyyy HH:mm') : 
                              'Not completed'
                            }
                          </p>
                        </div>
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

                  {/* Assessment Team */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Assessment Team
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Lead Assessor</h4>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {currentAssessment.assessor?.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              {currentAssessment.assessor?.name}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              {currentAssessment.assessor?.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                          Team Members ({currentAssessment.team?.length || 0})
                        </h4>
                        <div className="flex -space-x-2">
                          {currentAssessment.team?.slice(0, 4).map((member: any) => (
                            <div key={member._id} className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                              <span className="text-white font-semibold text-xs">
                                {member.name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {(currentAssessment.team?.length || 0) > 4 && (
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                              <span className="text-gray-700 dark:text-gray-300 font-semibold text-xs">
                                +{(currentAssessment.team?.length || 0) - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {selectedTab === 'worksheet' && (
                <motion.div
                  key="worksheet"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Worksheet Review ({currentAssessment.worksheetRows?.length || 0} tasks)
                      </h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Task
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Hazard
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Risk Assessment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Controls
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Recommendations
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {currentAssessment.worksheetRows?.map((row: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {row.taskName}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {row.activityService}
                                </div>
                                <div className="text-xs mt-1">
                                  <span className={`px-2 py-1 rounded-full ${
                                    row.routineNonRoutine === 'Routine' 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                  }`}>
                                    {row.routineNonRoutine}
                                  </span>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {Array.isArray(row.hazardConcern) 
                                    ? row.hazardConcern.join(', ') 
                                    : row.hazardConcern}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {row.hazardDescription}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2 text-xs">
                                    <span>L: {row.likelihood}</span>
                                    <span>×</span>
                                    <span>C: {row.consequence}</span>
                                    <span>=</span>
                                    <span className={`px-2 py-1 rounded font-bold ${
                                      row.riskScore > 15 ? 'bg-red-600 text-white' :
                                      row.riskScore > 8 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {row.riskScore}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      row.riskCategory === 'Very High' ? 'bg-red-100 text-red-800' :
                                      row.riskCategory === 'High' ? 'bg-orange-100 text-orange-800' :
                                      row.riskCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                                      row.riskCategory === 'Low' ? 'bg-green-100 text-green-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {row.riskCategory}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      row.significantNotSignificant === 'Significant' 
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {row.significantNotSignificant}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                                <div className="line-clamp-3">
                                  {row.existingRiskControl}
                                </div>
                              </td>
                              
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs">
                                <div className="line-clamp-3">
                                  {Array.isArray(row.recommendation) 
                                    ? row.recommendation.filter(r => r.trim()).join('; ') 
                                    : row.recommendation}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              )}

              {selectedTab === 'risks' && (
                <motion.div
                  key="risks"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Risk Analysis</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {(riskSummary?.veryHighRisk || 0) + (riskSummary?.highRisk || 0)}
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300">Critical Risks</div>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {riskSummary?.moderateRisk || 0}
                        </div>
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">Moderate Risks</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(riskSummary?.lowRisk || 0) + (riskSummary?.veryLowRisk || 0)}
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">Low Risks</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 dark:text-white">Risk Distribution</h4>
                      {[
                        { label: 'Very High', count: riskSummary?.veryHighRisk || 0, color: 'bg-red-600' },
                        { label: 'High', count: riskSummary?.highRisk || 0, color: 'bg-red-400' },
                        { label: 'Moderate', count: riskSummary?.moderateRisk || 0, color: 'bg-yellow-500' },
                        { label: 'Low', count: riskSummary?.lowRisk || 0, color: 'bg-green-500' },
                        { label: 'Very Low', count: riskSummary?.veryLowRisk || 0, color: 'bg-green-300' }
                      ].map((risk) => {
                        const percentage = riskSummary?.total ? (risk.count / riskSummary.total * 100).toFixed(1) : '0';
                        return (
                          <div key={risk.label} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className={`w-4 h-4 rounded ${risk.color}`}></div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{risk.label}</span>
                            </div>
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${risk.color}`} 
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white w-16 text-right">
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
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quality Rating */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quality Assessment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Quality Rating
                  </label>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 ${
                          star <= rating
                            ? 'text-yellow-500'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        <Star className="h-6 w-6 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {rating === 0 ? 'Click to rate' : 
                     rating === 1 ? 'Poor' :
                     rating === 2 ? 'Fair' :
                     rating === 3 ? 'Good' :
                     rating === 4 ? 'Very Good' : 'Excellent'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                    <div className="font-semibold text-green-600">{completionScore}%</div>
                    <div className="text-green-700 dark:text-green-300">Complete</div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                    <div className="font-semibold text-blue-600">{riskSummary?.total || 0}</div>
                    <div className="text-blue-700 dark:text-blue-300">Tasks</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Decision Panel */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Approval Decision
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comments *
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter your comments about the assessment..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Provide feedback on quality, completeness, and recommendations
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="success"
                    icon={ThumbsUp}
                    loading={isLoading && action === 'approve'}
                    onClick={() => {
                      setAction('approve');
                      handleApproval('approve');
                    }}
                    disabled={!comments.trim() || rating === 0}
                    className="w-full justify-center"
                  >
                    Approve Assessment
                  </Button>
                  
                  <Button
                    variant="danger"
                    icon={ThumbsDown}
                    loading={isLoading && action === 'reject'}
                    onClick={() => {
                      setAction('reject');
                      handleApproval('reject');
                    }}
                    disabled={!comments.trim()}
                    className="w-full justify-center"
                  >
                    Reject Assessment
                  </Button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Your decision will be final and notifications will be sent to the team
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Statistics
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Assessment Time:</span>
                  <span className="font-medium">
                    {currentAssessment.assignedAt && currentAssessment.completedAt
                      ? `${Math.ceil((new Date(currentAssessment.completedAt).getTime() - new Date(currentAssessment.assignedAt).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Team Size:</span>
                  <span className="font-medium">{(currentAssessment.team?.length || 0) + 1} members</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Significant Risks:</span>
                  <span className="font-medium">{riskSummary?.significantRisks || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Action Items:</span>
                  <span className="font-medium">{riskSummary?.recommendations || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIRAApproval;