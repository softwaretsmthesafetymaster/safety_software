import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  Bot,
  Lightbulb
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSReport } from '../../services/bbs/bbsService';
import { aiService } from '../../services/bbs/aiService';
import { format, addDays } from 'date-fns';

interface ReviewFormData {
  reviewDecision: 'approve' | 'reassign';
  reviewComments: string;
  reassignReason?: string;
  correctiveActions: Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
}

const BBSReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { users } = useAppSelector((state) => state.user);
  
  const [report, setReport] = useState<BBSReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ReviewFormData>({
    defaultValues: {
      reviewDecision: 'approve',
      correctiveActions: []
    }
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } = useFieldArray({
    control,
    name: 'correctiveActions'
  });

  const watchDecision = watch('reviewDecision');

  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => {
    if (report) {
      generateAISuggestions();
      performRiskAssessment();
    }
  }, [report]);

  const fetchReport = async () => {
    if (!id || !user?.companyId) return;
    
    try {
      setLoading(true);
      const fetchedReport = await bbsService.getBBSById(user.companyId, id);
      setReport(fetchedReport);
    } catch (error) {
      console.error('Error fetching report:', error);
      navigate('/bbs/observations');
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!report) return;
    
    try {
      const suggestions = await aiService.generateCorrectiveActions(report);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const performRiskAssessment = async () => {
    if (!report) return;
    
    try {
      const assessment = await aiService.analyzeRisk(report);
      setRiskAssessment(assessment);
    } catch (error) {
      console.error('Error performing risk assessment:', error);
    }
  };

  const addAISuggestion = (suggestion: string) => {
    appendAction({
      action: suggestion,
      assignedTo: '',
      dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      priority: 'medium'
    });
  };

  const onSubmit = async (data: ReviewFormData) => {
    if (!id || !user?.companyId) return;
    
    try {
      setSubmitting(true);
      await bbsService.reviewBBSReport(user.companyId, id, data);
      navigate(`/bbs/observations/${id}`);
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Report not found
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
            Review BBS Observation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and assign corrective actions for {report.reportNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Observation Summary */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observation Summary
            </h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {report.observationType.replace('_', ' ').toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Severity:</span> {report.severity.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">Plant:</span> {report.plantId?.name}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {format(new Date(report.observationDate), 'MMM dd, yyyy')}
                </div>
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-gray-600 dark:text-gray-400">{report.description}</p>
              </div>
            </div>
          </Card>

          {/* AI Risk Assessment */}
          {riskAssessment && (
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Risk Assessment
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${
                    riskAssessment.riskLevel === 'critical' ? 'text-red-600' :
                    riskAssessment.riskLevel === 'high' ? 'text-orange-600' :
                    riskAssessment.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {riskAssessment.riskLevel.toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.probability}/10
                  </div>
                  <div className="text-sm text-gray-600">Probability</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {riskAssessment.impact}/10
                  </div>
                  <div className="text-sm text-gray-600">Impact</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {riskAssessment.overallScore}/100
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Top Recommendations:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {riskAssessment.recommendations.slice(0, 3).map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-1.5 w-1.5 bg-purple-600 rounded-full mt-2 mr-2"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {/* Review Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Review Decision
              </h2>
              
              {/* Decision Radio Buttons */}
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    {...register('reviewDecision')}
                    type="radio"
                    value="approve"
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Approve and Assign Actions
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Accept the observation and assign corrective actions
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    {...register('reviewDecision')}
                    type="radio"
                    value="reassign"
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Reassign for More Information
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Request additional details or clarification
                    </p>
                  </div>
                </label>
              </div>

              {/* Review Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review Comments *
                </label>
                <textarea
                  {...register('reviewComments', { required: 'Review comments are required' })}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Provide detailed review comments..."
                />
                {errors.reviewComments && (
                  <p className="mt-1 text-sm text-red-600">{errors.reviewComments.message}</p>
                )}
              </div>

              {/* Reassign Reason */}
              {watchDecision === 'reassign' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Reassignment *
                  </label>
                  <textarea
                    {...register('reassignReason', { required: 'Reassign reason is required' })}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Explain why this observation needs more information..."
                  />
                  {errors.reassignReason && (
                    <p className="mt-1 text-sm text-red-600">{errors.reassignReason.message}</p>
                  )}
                </div>
              )}

              {/* Corrective Actions */}
              {watchDecision === 'approve' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Corrective Actions
                    </h3>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Plus}
                      onClick={() => appendAction({
                        action: '',
                        assignedTo: '',
                        dueDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                        priority: 'medium'
                      })}
                    >
                      Add Action
                    </Button>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.length > 0 && (
                    <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center mb-3">
                        <Lightbulb className="h-4 w-4 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                          AI Suggested Actions
                        </span>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {suggestion}
                            </span>
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={() => addAISuggestion(suggestion)}
                            >
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <div className="space-y-4">
                    {actionFields.map((field, index) => (
                      <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Action Description *
                            </label>
                            <textarea
                              {...register(`correctiveActions.${index}.action`, { required: 'Action is required' })}
                              rows={2}
                              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              placeholder="Describe the corrective action..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Assign To *
                            </label>
                            <select
                              {...register(`correctiveActions.${index}.assignedTo`, { required: 'Assignee is required' })}
                              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="">Select Person</option>
                              {users.filter(u => u.companyId === user?.companyId).map((person) => (
                                <option key={person._id} value={person._id}>
                                  {person.name} ({person.role})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Due Date *
                            </label>
                            <input
                              {...register(`correctiveActions.${index}.dueDate`, { required: 'Due date is required' })}
                              type="date"
                              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Priority *
                            </label>
                            <select
                              {...register(`correctiveActions.${index}.priority`)}
                              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                              onClick={() => removeAction(index)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/bbs/observations/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  icon={watchDecision === 'approve' ? CheckCircle : XCircle}
                >
                  {watchDecision === 'approve' ? 'Approve & Assign' : 'Reassign'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk Assessment Card */}
          {riskAssessment && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Risk Assessment
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Level:</span>
                  <span className={`text-sm font-medium ${
                    riskAssessment.riskLevel === 'critical' ? 'text-red-600' :
                    riskAssessment.riskLevel === 'high' ? 'text-orange-600' :
                    riskAssessment.riskLevel === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {riskAssessment.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Overall Score:</span>
                  <span className="text-sm font-medium">{riskAssessment.overallScore}/100</span>
                </div>
              </div>
            </Card>
          )}

          {/* Observer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Observer Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900 dark:text-white">{report.observer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Role:</span>
                <span className="text-gray-900 dark:text-white">{report.observer?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reported:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
          </Card>

          {/* Observed Persons */}
          {report.observedPersons && report.observedPersons.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Observed Persons
              </h3>
              <div className="space-y-3">
                {report.observedPersons.map((person, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{person.name}</p>
                    {person.designation && (
                      <p className="text-gray-600 dark:text-gray-400">{person.designation}</p>
                    )}
                    {person.department && (
                      <p className="text-gray-600 dark:text-gray-400">{person.department}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BBSReview;