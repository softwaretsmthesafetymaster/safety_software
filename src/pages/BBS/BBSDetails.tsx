import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Edit,
  Download,
  Eye,
  Users,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  MessageSquare,
  Star,
  Bot
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchBBSById } from '../../store/slices/bbsSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { reportService } from '../../services/bbs/reportService';
import { aiService } from '../../services/bbs/aiService';
import { format } from 'date-fns';

const BBSDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentReport, isLoading } = useAppSelector((state) => state.bbs);
  const { currentCompany } = useAppSelector((state) => state.company);
  
  const [actionId, setActionId] = useState<string | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const bbsConfig = currentCompany?.config?.bbs;
  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchBBSById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentReport?.correctiveActions) {
      const action = currentReport.correctiveActions.find((a: any) => a.assignedTo?._id === user._id);
      if (action) {
        setActionId(action._id);
      }
    }
  }, [currentReport, user]);

  useEffect(() => {
    if (currentReport) {
      generateRiskAssessment();
    }
  }, [currentReport]);

  const generateRiskAssessment = async () => {
    if (!currentReport) return;
    
    try {
      const assessment = await aiService.analyzeRisk(currentReport);
      setRiskAssessment(assessment);
    } catch (error) {
      console.error('Error generating risk assessment:', error);
    }
  };

  const downloadReport = (format: 'pdf' | 'word' | 'excel') => {
    if (!currentReport) return;
    
    try {
      if (format === 'pdf') {
        reportService.downloadPDF(currentReport, currentCompany);
      } else if (format === 'word') {
        reportService.generateWordDocument(currentReport, currentCompany);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentReport) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          BBS observation not found
        </h3>
        <Button
          as={Link}
          to="/bbs/observations"
          variant="primary"
          className="mt-4"
        >
          Back to Observations
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending_closure':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'open':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getNextAction = () => {
    switch (currentReport.status) {
      case 'open':
        if (['hod', 'plant_head', 'safety_incharge'].includes(user?.role || '')) {
          return { text: 'Review', link: `/bbs/observations/${id}/review`, icon: CheckCircle };
        }
        break;
      case 'approved':
        if (currentReport.correctiveActions?.some(action => action.assignedTo?._id === user?.id)) {
          return { text: 'Complete Action', link: `/bbs/observations/${id}/complete`, icon: CheckCircle };
        }
        break;
      case 'pending_closure':
        if (['safety_incharge', 'plant_head'].includes(user?.role || '')) {
          return { text: 'Approve Closure', link: `/bbs/observations/${id}/approve`, icon: CheckCircle };
        }
        break;
    }
    return null;
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentReport.reportNumber}
            </h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentReport.status)}`}>
              {currentReport.status === 'closed' ? <CheckCircle className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
              {currentReport.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {currentReport.plantId?.name} • Observed {format(new Date(currentReport.observationDate), 'MMM dd, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
            <div className="relative group">
            <Button
              variant="secondary"
              icon={Download}
            >
              Download
            </Button>
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-32 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => downloadReport('pdf')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                PDF Report
              </button>
              <button
                onClick={() => downloadReport('word')}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Word Document
              </button>
            </div>
          </div>

          {nextAction && (
            <Button
              as={Link}
              to={nextAction.link}
              variant="primary"
              icon={nextAction.icon}
            >
              {nextAction.text}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Risk Assessment */}
          {riskAssessment && (
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Risk Assessment
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-xl font-bold ${
                    riskAssessment.riskLevel === 'critical' ? 'text-red-600' :
                    riskAssessment.riskLevel === 'high' ? 'text-orange-600' :
                    riskAssessment.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {riskAssessment.riskLevel.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-600">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.probability}/10
                  </div>
                  <div className="text-xs text-gray-600">Probability</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.impact}/10
                  </div>
                  <div className="text-xs text-gray-600">Impact</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">
                    {riskAssessment.overallScore}/100
                  </div>
                  <div className="text-xs text-gray-600">Overall Score</div>
                </div>
              </div>
            </Card>
          )}

          {/* Observation Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Observation Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observation Type
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currentReport.observationType === 'safe_behavior' ? 'bg-green-100 text-green-800' :
                    currentReport.observationType === 'unsafe_act' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {currentReport.observationType.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentReport.category}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="mt-1">
                  <p className={`text-sm text-gray-900 dark:text-white ${!showFullDescription && currentReport.description.length > 200 ? 'line-clamp-3' : ''}`}>
                    {currentReport.description}
                  </p>
                  {currentReport.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-500 text-sm mt-1"
                    >
                      {showFullDescription ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              </div>
              {currentReport.immediateAction && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Immediate Action Taken
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentReport.immediateAction}
                  </p>
                </div>
              )}
              {currentReport.rootCause && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Root Cause
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentReport.rootCause}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Photos */}
          {currentReport.photos && currentReport.photos.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Evidence Photos
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentReport.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo.url}
                    alt={photo.description || `Evidence ${index + 1}`}
                    onClick={() => window.open(photo.url, '_blank')}  
                    className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Observed Persons */}
          {currentReport.observedPersons && currentReport.observedPersons.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Observed Persons
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentReport.observedPersons.map((person: any, index: number) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {person.name}
                    </p>
                    {person.designation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Designation: {person.designation}
                      </p>
                    )}
                    {person.department && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Department: {person.department}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Corrective Actions */}
          {currentReport.correctiveActions && currentReport.correctiveActions.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Corrective Actions
              </h2>
              <div className="space-y-4">
                {currentReport.correctiveActions.map((action: any, index: number) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {action.action}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {action.assignedTo && (
                            <span>Assigned to: {action.assignedTo.name}</span>
                          )}
                          {action.dueDate && (
                            <span>Due: {format(new Date(action.dueDate), 'MMM dd, yyyy')}</span>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        action.status === 'completed' ? 'bg-green-100 text-green-800' :
                        action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {action.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    {action.completionEvidence && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                          Completion Evidence:
                        </h4>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          {action.completionEvidence}
                        </p>
                        {action.effectivenessRating && (
                          <div className="flex items-center mt-2">
                            <span className="text-sm text-green-700 dark:text-green-300 mr-2">
                              Effectiveness:
                            </span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <Star
                                  key={rating}
                                  className={`h-3 w-3 ${
                                    rating <= action.effectivenessRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Review Comments */}
          {currentReport.reviewComments && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Review Comments
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {currentReport.reviewedBy?.name}
                  </span>
                  <span className="text-xs text-blue-700 dark:text-blue-300 ml-2">
                    {currentReport.reviewedAt && format(new Date(currentReport.reviewedAt), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {currentReport.reviewComments}
                </p>
              </div>
            </Card>
          )}


          {/* Detailed Timeline */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Observation Timeline
            </h2>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-6">
                {/* Observation Submitted */}
                <div className="relative flex items-start space-x-4">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center relative z-10">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Observation Submitted
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(currentReport.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Reported by {currentReport.observer?.name} • {currentReport.observationType.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Review & Assignment */}
                <div className="relative flex items-start space-x-4">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center relative z-10 ${
                    currentReport.reviewedAt ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`h-4 w-4 ${
                      currentReport.reviewedAt ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        currentReport.reviewedAt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        Review & Assignment
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentReport.reviewedAt ? format(new Date(currentReport.reviewedAt), 'MMM dd, yyyy HH:mm') : 'Pending'}
                      </p>
                    </div>
                    {currentReport.reviewedAt ? (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Reviewed by {currentReport.reviewedBy?.name} • {currentReport.reviewDecision?.toUpperCase()}
                        </p>
                        {currentReport.correctiveActions && currentReport.correctiveActions.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {currentReport.correctiveActions.length} action(s) assigned
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Awaiting review by HOD or Plant Head
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Execution */}
                {currentReport.correctiveActions && currentReport.correctiveActions.length > 0 && (
                  <div className="space-y-4">
                    {currentReport.correctiveActions.map((action: any, index: number) => (
                      <div key={index} className="relative flex items-start space-x-4">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center relative z-10 ${
                          action.status === 'completed' ? 'bg-purple-100' : 
                          action.status === 'in_progress' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          <CheckCircle className={`h-4 w-4 ${
                            action.status === 'completed' ? 'text-purple-600' :
                            action.status === 'in_progress' ? 'text-yellow-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${
                              action.status === 'completed' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              Action {index + 1}: {action.status.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {action.completedDate ? format(new Date(action.completedDate), 'MMM dd, yyyy HH:mm') : 
                               action.dueDate ? `Due: ${format(new Date(action.dueDate), 'MMM dd, yyyy')}` : 'No due date'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {action.action}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Assigned to: {action.assignedTo?.name || 'Unassigned'}
                          </p>
                          {action.completionEvidence && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                              <strong>Evidence:</strong> {action.completionEvidence}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Approval */}
                <div className="relative flex items-start space-x-4">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center relative z-10 ${
                    currentReport.status === 'closed' ? 'bg-green-100' : 
                    currentReport.status === 'pending_closure' ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`h-4 w-4 ${
                      currentReport.status === 'closed' ? 'text-green-600' :
                      currentReport.status === 'pending_closure' ? 'text-orange-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        currentReport.status === 'closed' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        Final Closure
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentReport.status === 'closed' ? 'Completed' : 
                         currentReport.status === 'pending_closure' ? 'Pending Approval' : 'Awaiting Actions'}
                      </p>
                    </div>
                    {currentReport.status === 'closed' && currentReport.lessonsLearned && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                        <strong>Lessons Learned:</strong> {currentReport.lessonsLearned}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              {nextAction && (
                <Button
                  as={Link}
                  to={nextAction.link}
                  variant="primary"
                  className="w-full"
                  icon={nextAction.icon}
                >
                  {nextAction.text}
                </Button>
              )}
              <Button
                variant="secondary"
                className="w-full group"
                icon={Download}
                onClick={() => downloadReport('pdf')}
              >
                Download Report
              </Button>
              <Button
                as={Link}
                to={`/bbs/observations/${id}/edit`}
                variant="secondary"
                className="w-full"
                icon={Edit}
                disabled={currentReport.status !== 'open'}
              >
                Edit Observation
              </Button>
            </div>
          </Card>

          {/* Observation Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observation Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Observed:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentReport.observationDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Observer:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentReport.observer?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentReport.plantId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Location:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentReport.location?.area}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Severity:</span>
                <span className={`font-medium ${
                  currentReport.severity === 'critical' ? 'text-red-600' :
                  currentReport.severity === 'high' ? 'text-orange-600' :
                  currentReport.severity === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {currentReport.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentReport.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </Card>

          {/* Workflow Progress */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Workflow Progress
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Observation Submitted
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(currentReport.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  currentReport.reviewedAt ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <CheckCircle className={`h-4 w-4 ${
                    currentReport.reviewedAt ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    currentReport.reviewedAt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Review & Assignment
                  </p>
                  {currentReport.reviewedAt ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(currentReport.reviewedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  currentReport.completedAt ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <CheckCircle className={`h-4 w-4 ${
                    currentReport.completedAt ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    currentReport.completedAt ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Action Completion
                  </p>
                  {currentReport.completedAt ? (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(currentReport.completedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                  currentReport.status === 'closed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <CheckCircle className={`h-4 w-4 ${
                    currentReport.status === 'closed' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    currentReport.status === 'closed' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Final Closure
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentReport.status === 'closed' ? 'Completed' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BBSDetails;