import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  Save,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Camera,
  AlertTriangle,
  Upload,
  CheckSquare
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById, closePermit } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { format } from 'date-fns';
import { useExport } from '../../hooks/useExport';

interface ClosureData {
  closureReason: string;
  workCompleted: boolean;
  safetyChecklistCompleted: boolean;
  equipmentReturned: boolean;
  areaCleared: boolean;
  closureEvidence: string;
  closurePhotos: string[];
  closureComments: string;
  actualEndTime: string;
}

const PermitClosure: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const { exportItem, isExporting } = useExport();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ClosureData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ClosureData) => {
    if (!user?.companyId || !id) return;

    setIsSubmitting(true);
    try {
      await dispatch(closePermit({
        companyId: user.companyId,
        id,
        closureData: data
      })).unwrap();
      
      toast.success('Permit closure submitted successfully');
      navigate('/ptw/permits');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit closure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (decision: 'approve' | 'reject') => {
    if (!user?.companyId || !id) return;

    setIsSubmitting(true);
    try {
      await dispatch(closePermit({
        companyId: user.companyId,
        id,
        approvalDecision: decision
      })).unwrap();
      
      toast.success(`Permit ${decision === 'approve' ? 'closed' : 'reassigned'} successfully`);
      navigate('/ptw/permits');
    } catch (error: any) {
      toast.error(error.message || 'Failed to process closure');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!currentPermit) return;
    
    try {
      await exportItem(currentPermit, 'permit', format);
      toast.success(`Permit exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error('Failed to export permit');
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentPermit) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Permit not found
        </h3>
      </div>
    );
  }

  const isApprovalMode = currentPermit.status === 'pending_closure';
  const canSubmitClosure = ['active', 'expired'].includes(currentPermit.status) &&
                          (String(currentPermit.requestedBy._id) === String(user?._id) ||
                           ['hod', 'safety_incharge','plant_head'].includes(user?.role || ''));
  
  const canApproveClosure = isApprovalMode && ['hod', 'safety_incharge','plant_head'].includes(user?.role || '');

  if (!canSubmitClosure && !canApproveClosure) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-yellow-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Not Authorized
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You are not authorized to close this permit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isApprovalMode ? 'Approve Permit Closure' : 'Submit Permit Closure'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPermit.permitNumber} - {isApprovalMode ? 'Review and approve closure' : 'Submit permit for closure'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('pdf')}
              loading={isExporting}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('excel')}
              loading={isExporting}
            >
              Excel
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/ptw/permits/${id}`)}
          >
            Back to Permit
          </Button>
          {isApprovalMode ? (
            <>
              <Button
                variant="danger"
                onClick={() => handleApproval('reject')}
                loading={isSubmitting}
              >
                Reject Closure
              </Button>
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={() => handleApproval('approve')}
                loading={isSubmitting}
              >
                Approve Closure
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              icon={Save}
              loading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Submit Closure
            </Button>
          )}
        </div>
      </div>

      {isApprovalMode ? (
        /* Approval View */
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Closure Details for Review
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Closure Reason
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {currentPermit.closure?.closureReason || 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Evidence of Completion
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {currentPermit.closure?.closureEvidence || 'Not provided'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comments
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {currentPermit.closure?.closureComments || 'No additional comments'}
                </p>
              </div>
              
              {/* Closure Checklist Review */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Closure Checklist Verification
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {currentPermit.closure?.workCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      Work Completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {currentPermit.closure?.safetyChecklistCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      Safety Checklist Completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {currentPermit.closure?.equipmentReturned ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      Equipment Returned
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {currentPermit.closure?.areaCleared ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900 dark:text-white">
                      Area Cleared
                    </span>
                  </div>
                </div>
              </div>

              {/* Submitted By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Submitted By
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentPermit.closure?.submittedBy?.name} on {' '}
                  {currentPermit.closure?.submittedAt && format(new Date(currentPermit.closure.submittedAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Closure Checklist */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Closure Checklist
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  {...register('workCompleted', { required: 'Work completion confirmation is required' })}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All work has been completed as per permit scope
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Confirm that all activities mentioned in the work description have been completed successfully
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  {...register('safetyChecklistCompleted', { required: 'Safety checklist confirmation is required' })}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Safety checklist has been completed and verified
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    All safety requirements and precautions have been verified and documented
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  {...register('equipmentReturned')}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    All equipment and tools have been returned
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tools, equipment, and materials have been properly returned and accounted for
                  </p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  {...register('areaCleared', { required: 'Area clearance confirmation is required' })}
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Work area has been cleared and made safe
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Area is clean, safe, and ready for normal operations
                  </p>
                </div>
              </label>
            </div>

            {(errors.workCompleted || errors.safetyChecklistCompleted || errors.areaCleared) && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                Please complete all required checklist items before submitting closure
              </p>
            )}
          </Card>

          {/* Closure Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Closure Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="closureReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Closure Reason *
                </label>
                <select
                  {...register('closureReason', { required: 'Closure reason is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select Reason</option>
                  <option value="work_completed">Work Completed Successfully</option>
                  <option value="work_cancelled">Work Cancelled</option>
                  <option value="permit_expired">Permit Expired</option>
                  <option value="safety_concern">Safety Concern Identified</option>
                  <option value="equipment_failure">Equipment Failure</option>
                  <option value="weather_conditions">Adverse Weather Conditions</option>
                </select>
                {errors.closureReason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.closureReason.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="actualEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Actual End Time *
                </label>
                <input
                  {...register('actualEndTime', { required: 'Actual end time is required' })}
                  type="datetime-local"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.actualEndTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.actualEndTime.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="closureEvidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Evidence of Completion *
                </label>
                <textarea
                  {...register('closureEvidence', { required: 'Evidence is required' })}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Provide detailed evidence that work has been completed safely and according to specifications..."
                />
                {errors.closureEvidence && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.closureEvidence.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="closureComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Comments
                </label>
                <textarea
                  {...register('closureComments')}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Any additional comments about the work completion, lessons learned, or recommendations..."
                />
              </div>
            </div>
          </Card>

          {/* Photo Upload */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Camera className="h-5 w-5 mr-2" />
              Completion Photos & Evidence
            </h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                    Upload completion photos and documents
                  </span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,.pdf,.doc,.docx" />
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, PDF up to 10MB each. Include before/after photos, completion certificates, test results, etc.
                </p>
              </div>
            </div>
          </Card>
        </form>
      )}
    </div>
  );
};

export default PermitClosure;