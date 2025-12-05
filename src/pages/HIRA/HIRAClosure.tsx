import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadService } from '../../services/hira/downloadService';
import {
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  Download,
  Users,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  Star,
  Award,
  BarChart3
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { closeHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

const HIRAClosure: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);

  const [closureComments, setClosureComments] = useState('');
  const [performanceRating, setPerformanceRating] = useState(0);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleClose = async () => {
    if (!closureComments.trim()) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please provide closure comments'
      }));
      return;
    }

    try {
      await dispatch(closeHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        comments: closureComments,
        performanceRating,
        lessonsLearned
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Assessment closed successfully'
      }));

      navigate('/hira/assessments');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to close assessment'
      }));
    }
  };

  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    try {
      await DownloadService.download(format, currentAssessment);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to download assessment'
      }));
    }
  };

  const getActionsSummary = () => {
    if (!currentAssessment?.worksheetRows) return null;

    const actionItems = currentAssessment.worksheetRows.filter(row => 
      row.recommendation && (
        Array.isArray(row.recommendation) 
          ? row.recommendation.some(r => r.trim()) 
          : row.recommendation.trim()
      )
    );

    const openActions = actionItems.filter(row => row.actionStatus !== 'Completed');
    const completedActions = actionItems.filter(row => row.actionStatus === 'Completed');
    const overdueActions = actionItems.filter(row => 
      row.targetDate && 
      row.actionStatus !== 'Completed' && 
      new Date(row.targetDate) < new Date()
    );

    return { actionItems, openActions, completedActions, overdueActions };
  };

  const getCompletionMetrics = () => {
    const actionsSummary = getActionsSummary();
    if (!actionsSummary) return null;

    const totalActions = actionsSummary.actionItems.length;
    const completedActions = actionsSummary.completedActions.length;
    const completionRate = totalActions > 0 ? (completedActions / totalActions * 100) : 100;
    
    const timeSpent = currentAssessment?.assignedAt && currentAssessment?.closedAt
      ? Math.ceil((new Date(currentAssessment.closedAt).getTime() - new Date(currentAssessment.assignedAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      completionRate,
      timeSpent,
      totalTasks: currentAssessment?.riskSummary?.totalTasks || 0,
      highRiskItems: currentAssessment?.riskSummary?.highRiskCount || 0,
      totalActions
    };
  };

  const actionsSummary = getActionsSummary();
  const metrics = getCompletionMetrics();

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
              Close HIRA Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>Status: Actions Completed</span>
              <span>•</span>
              <span>Ready for closure</span>
            </div>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setShowSummary(!showSummary)}
            icon={showSummary ? CheckCircle : BarChart3}
          >
            {showSummary ? 'Hide' : 'Show'} Performance Summary
          </Button>
        </motion.div>

        {/* Performance Summary (collapsible) */}
        <AnimatePresence>
          {showSummary && metrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <Card className="p-4 text-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{metrics.completionRate.toFixed(1)}%</div>
                <div className="text-sm text-green-700 dark:text-green-300">Completion Rate</div>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                <div className="flex items-center justify-center mb-2">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{metrics.timeSpent}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Days to Complete</div>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20">
                <div className="flex items-center justify-center mb-2">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{metrics.totalTasks}</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Tasks Assessed</div>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-600">{metrics.highRiskItems}</div>
                <div className="text-sm text-red-700 dark:text-red-300">High Risk Items</div>
              </Card>

              <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{metrics.totalActions}</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Action Items</div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Closure Summary */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Assessment Closure Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assessment Number
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                      {currentAssessment?.assessmentNumber}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Current Status
                    </label>
                    <span className="mt-1 inline-flex px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {currentAssessment?.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Approved Date
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentAssessment?.approvedAt ? 
                        format(new Date(currentAssessment.approvedAt), 'MMM dd, yyyy HH:mm') : 
                        'Not approved'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Approved By
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentAssessment?.approvedBy?.name || 'Not approved'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions Completed
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {currentAssessment?.actionsCompletedAt ? 
                        format(new Date(currentAssessment.actionsCompletedAt), 'MMM dd, yyyy HH:mm') : 
                        'Not completed'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Duration
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {metrics?.timeSpent || 0} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Status */}
              {actionsSummary && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                    Action Items Status
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {actionsSummary.completedActions.length}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">Completed</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-8 w-8 text-orange-500" />
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {actionsSummary.openActions.length}
                          </div>
                          <div className="text-sm text-orange-700 dark:text-orange-300">Remaining</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {actionsSummary.overdueActions.length}
                          </div>
                          <div className="text-sm text-red-700 dark:text-red-300">Overdue</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Closure Form */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Closure Details
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Performance Rating
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setPerformanceRating(star)}
                        className={`p-1 transition-colors ${
                          star <= performanceRating
                            ? 'text-yellow-500'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
                        }`}
                      >
                        <Star className="h-7 w-7 fill-current" />
                      </button>
                    ))}
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      {performanceRating === 0 ? 'Click to rate' : 
                       performanceRating === 1 ? 'Poor Performance' :
                       performanceRating === 2 ? 'Below Average' :
                       performanceRating === 3 ? 'Satisfactory' :
                       performanceRating === 4 ? 'Good Performance' : 'Excellent Performance'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Closure Comments *
                  </label>
                  <textarea
                    value={closureComments}
                    onChange={(e) => setClosureComments(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Provide final comments about the assessment completion, quality, and outcomes..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Summarize the assessment outcomes and overall satisfaction with the process
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lessons Learned
                  </label>
                  <textarea
                    value={lessonsLearned}
                    onChange={(e) => setLessonsLearned(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Document key learnings and improvements for future assessments..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Optional: Share insights that could benefit future HIRA assessments
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => navigate(`/hira/assessments/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    icon={CheckCircle}
                    onClick={handleClose}
                    loading={isLoading}
                    disabled={!closureComments.trim()}
                  >
                    Close Assessment
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Closure Checklist */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Closure Checklist
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Assessment completed</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Assessment approved</span>
                </div>
                <div className={`flex items-center space-x-3 ${
                  actionsSummary?.openActions.length === 0 ? 'opacity-100' : 'opacity-50'
                }`}>
                  {actionsSummary?.openActions.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className="text-sm text-gray-900 dark:text-white">
                    All actions completed ({actionsSummary?.completedActions.length || 0}/{actionsSummary?.actionItems.length || 0})
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Review completed</span>
                </div>
              </div>
              
              {actionsSummary?.openActions.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      {actionsSummary.openActions.length} action(s) still pending
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Consider closing with pending actions noted in comments
                  </p>
                </div>
              )}
            </Card>

            {/* Final Reports */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Final Reports
              </h3>
              
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  icon={Download}
                  className="w-full justify-start"
                  onClick={() => handleDownload('pdf')}
                >
                  <div className="text-left">
                    <div className="font-medium">PDF Report</div>
                    <div className="text-xs opacity-75">Complete assessment summary</div>
                  </div>
                </Button>
                
                <Button
                  variant="secondary"
                  icon={Download}
                  className="w-full justify-start"
                  onClick={() => handleDownload('excel')}
                >
                  <div className="text-left">
                    <div className="font-medium">Excel Worksheet</div>
                    <div className="text-xs opacity-75">Detailed data export</div>
                  </div>
                </Button>
                
                <Button
                  variant="secondary"
                  icon={Download}
                  className="w-full justify-start"
                  onClick={() => handleDownload('word')}
                >
                  <div className="text-left">
                    <div className="font-medium">Word Document</div>
                    <div className="text-xs opacity-75">Formal report format</div>
                  </div>
                </Button>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Archive Complete
                  </span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  All documents will be archived for future reference
                </p>
              </div>
            </Card>

            {/* Assessment Timeline */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Assessment Journey
              </h3>
              
              <div className="space-y-4">
                {[
                  { 
                    date: currentAssessment?.createdAt, 
                    label: 'Created', 
                    icon: FileText, 
                    color: 'bg-blue-100 text-blue-600' 
                  },
                  { 
                    date: currentAssessment?.assignedAt, 
                    label: 'Assigned', 
                    icon: Users, 
                    color: 'bg-purple-100 text-purple-600' 
                  },
                  { 
                    date: currentAssessment?.completedAt, 
                    label: 'Completed', 
                    icon: CheckCircle, 
                    color: 'bg-green-100 text-green-600' 
                  },
                  { 
                    date: currentAssessment?.approvedAt, 
                    label: 'Approved', 
                    icon: CheckCircle, 
                    color: 'bg-emerald-100 text-emerald-600' 
                  },
                  { 
                    date: currentAssessment?.actionsCompletedAt, 
                    label: 'Actions Done', 
                    icon: Target, 
                    color: 'bg-orange-100 text-orange-600' 
                  }
                ].map((item, index) => (
                  item.date && (
                    <div key={index} className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIRAClosure;