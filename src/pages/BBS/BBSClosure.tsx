import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  CheckCircle,
  XCircle,
  Star,
  FileText,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSReport } from '../../services/bbs/bbsService';
import { format } from 'date-fns';

interface ClosureFormData {
  approvalDecision: 'approve' | 'reject';
  closureComments: string;
}

const BBSClosure: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [report, setReport] = useState<BBSReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ClosureFormData>({
    defaultValues: {
      approvalDecision: 'approve'
    }
  });

  const watchDecision = watch('approvalDecision');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    if (!id || !user?.companyId) return;
    
    try {
      setLoading(true);
      const fetchedReport = await bbsService.getBBSById(user.companyId, id);
      setReport(fetchedReport);
      
      if (fetchedReport.status !== 'pending_closure') {
        navigate('/bbs/observations');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      navigate('/bbs/observations');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClosureFormData) => {
    if (!id || !user?.companyId) return;
    
    try {
      setSubmitting(true);
      await bbsService.closeBBSReport(user.companyId, id, data);
      navigate(`/bbs/observations/${id}`);
    } catch (error) {
      console.error('Error closing report:', error);
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
            Review Action Completion
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Approve or reject completion for {report.reportNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Completed Actions Review */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Completed Actions
            </h2>
            <div className="space-y-4">
              {report.correctiveActions?.map((action, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {action.action}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Completed by: {action.assignedTo?.name}
                      </p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {action.status}
                    </span>
                  </div>
                  
                  {action.completionEvidence && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Evidence:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {action.completionEvidence}
                      </p>
                    </div>
                  )}
                  
                  {action.effectivenessRating && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                        Effectiveness:
                      </span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={rating}
                            className={`h-4 w-4 ${
                              rating <= action.effectivenessRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-600">
                          ({action.effectivenessRating}/5)
                        </span>
                      </div>
                    </div>
                  )}
                  {Array.isArray(action?.evidencePhotos) && action?.evidencePhotos.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700 pointer dark:text-gray-300">Evidence:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        <img className='cursor-pointer' onClick={() => window.open(action?.evidencePhotos, '_blank')}
                        src={action?.evidencePhotos} alt="Evidence" height={200} width={200}/>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Closure Decision Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Closure Decision
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    {...register('approvalDecision')}
                    type="radio"
                    value="approve"
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Approve and Close
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Actions are satisfactory and observation can be closed
                    </p>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    {...register('approvalDecision')}
                    type="radio"
                    value="reject"
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        Reject and Reassign
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Actions are insufficient and require additional work
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {watchDecision === 'approve' ? 'Closure Comments' : 'Reason for Rejection'} *
                </label>
                <textarea
                  {...register('closureComments', { required: 'Comments are required' })}
                  rows={4}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder={
                    watchDecision === 'approve' 
                      ? "Provide final comments on the observation closure..."
                      : "Explain why the completion is not satisfactory and what additional actions are needed..."
                  }
                />
                {errors.closureComments && (
                  <p className="mt-1 text-sm text-red-600">{errors.closureComments.message}</p>
                )}
              </div>

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
                  variant={watchDecision === 'approve' ? 'success' : 'danger'}
                  loading={submitting}
                  icon={watchDecision === 'approve' ? CheckCircle : XCircle}
                >
                  {watchDecision === 'approve' ? 'Approve & Close' : 'Reject & Reassign'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Observation Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Observation Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Observer:</span>
                <span className="text-gray-900 dark:text-white">{report.observer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(report.observationDate), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Severity:</span>
                <span className={`font-medium ${
                  report.severity === 'critical' ? 'text-red-600' :
                  report.severity === 'high' ? 'text-orange-600' :
                  report.severity === 'medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {report.severity.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plant:</span>
                <span className="text-gray-900 dark:text-white">{report.plantId?.name}</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Timeline
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Observation Reported
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {report.reviewedAt && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Reviewed & Approved
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(report.reviewedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
              
              {report.completedAt && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Actions Completed
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(new Date(report.completedAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Pending Final Approval
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Awaiting your decision
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

export default BBSClosure;