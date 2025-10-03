import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertTriangle,
  MessageSquare,
  User,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById, approvePermit } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

interface ApprovalData {
  decision: 'approve' | 'reject';
  comments: string;
}

const PermitApproval: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [decision, setDecision] = useState<'approve' | 'reject' | ''>('');

  const { register, handleSubmit, formState: { errors } } = useForm<ApprovalData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ApprovalData) => {
    if (!user?.companyId || !id || !decision) return;

    try {
      await dispatch(approvePermit({
        companyId: user.companyId,
        id,
        decision,
        comments: data.comments
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: `Permit ${decision}d successfully`
      }));
      navigate('/ptw/permits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to process approval'
      }));
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

  const currentApproval = currentPermit.approvals?.find(app => app.status === 'pending');
  const ptwConfig = currentCompany?.config?.modules?.ptw;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Permit Approval Review
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve permit: {currentPermit.permitNumber}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/ptw/permits/${id}`)}
          >
            Back to Permit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Permit Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Work Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Permit Types
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {currentPermit.types?.map((type, index) => (
                    <span
                      key={index}
                      className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                    >
                      {type.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Description
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {currentPermit.workDescription}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {currentPermit.location?.area} - {currentPermit.location?.specificLocation}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Plant & Area
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentPermit.plantId?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date & Time
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(currentPermit.schedule?.startDate), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date & Time
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(currentPermit.schedule?.endDate), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Safety Review */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Safety Review
            </h2>
            
            <div className="space-y-6">
              {/* Hazards */}
              {currentPermit.hazards && currentPermit.hazards.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Identified Hazards & Mitigations
                  </label>
                  <div className="space-y-3">
                    {currentPermit.hazards.map((hazard, index) => (
                      <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {hazard.type.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <strong>Mitigation:</strong> {hazard.mitigation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PPE Requirements */}
              {currentPermit.ppe && currentPermit.ppe.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    PPE Requirements
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currentPermit.ppe.map((ppe, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className={`h-4 w-4 ${ppe.required ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={`text-sm ${ppe.required ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                          {ppe.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Checklist Review */}
              {currentPermit.safetyChecklist && currentPermit.safetyChecklist.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Safety Checklist Verification
                  </label>
                  <div className="space-y-3">
                    {currentPermit.safetyChecklist.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="mt-1">
                          {item.checked ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.item}
                          </p>
                          {item.remarks && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              <strong>Remarks:</strong> {item.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Personnel Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personnel Information
            </h2>
            
            <div className="space-y-4">
              {/* Contractor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contractor Details
                </label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {currentPermit.contractor?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Contact: {currentPermit.contractor?.contact}
                  </p>
                  {currentPermit.contractor?.license && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      License: {currentPermit.contractor.license}
                    </p>
                  )}
                </div>
              </div>

              {/* Workers */}
              {currentPermit.workers && currentPermit.workers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Workers ({currentPermit.workers.length})
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPermit.workers.map((worker, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {worker.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {worker.id}
                        </p>
                        {worker.contact && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Contact: {worker.contact}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                            worker.medicalFitness
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {worker.medicalFitness ? 'Medical Fit' : 'Medical Fitness Required'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Approval Panel */}
        <div className="space-y-6">
          {/* Approval Decision */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approval Decision
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Decision *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={(e) => setDecision(e.target.value as 'approve')}
                      className="text-green-600 focus:ring-green-500"
                    />
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Approve Permit
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        All safety requirements are met
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      value="reject"
                      checked={decision === 'reject'}
                      onChange={(e) => setDecision(e.target.value as 'reject')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <XCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Reject Permit
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Safety requirements not met
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comments *
                </label>
                <textarea
                  {...register('comments', { required: 'Comments are required' })}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Provide detailed comments for your decision..."
                />
                {errors.comments && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.comments.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant={decision === 'approve' ? 'success' : 'danger'}
                className="w-full"
                loading={isLoading}
                disabled={!decision}
                icon={decision === 'approve' ? CheckCircle : XCircle}
              >
                {decision === 'approve' ? 'Approve Permit' : 'Reject Permit'}
              </Button>
            </form>
          </Card>

          {/* Approval History */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approval History
            </h2>
            <div className="space-y-4">
              {currentPermit.approvals?.map((approval, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    approval.status === 'approved' ? 'bg-green-100 text-green-600' :
                    approval.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {approval.status === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                     approval.status === 'rejected' ? <XCircle className="h-4 w-4" /> :
                     <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Step {approval.step} - {approval.status.toUpperCase()}
                    </p>
                    {approval.approver && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {approval.approver.name} ({approval.approver.role})
                      </p>
                    )}
                    {approval.timestamp && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(approval.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                    {approval.comments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        "{approval.comments}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Permit Information */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Permit Information
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Permit Number:</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {currentPermit.permitNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Requested by:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.requestedBy?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.plantId?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {format(new Date(currentPermit.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Current Step:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentApproval?.step || 'N/A'} of {currentPermit.approvals?.length || 0}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermitApproval;