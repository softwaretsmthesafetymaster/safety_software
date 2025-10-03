import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById, closeIncident } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';

interface ClosureData {
  approvalDecision: 'approve' | 'reject';
  closureComments: string;
}

const IncidentClosure: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ClosureData>();

  const watchDecision = watch('approvalDecision');

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ClosureData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(closeIncident({
        companyId: user.companyId,
        id,
        closureData: data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: `Incident ${data.approvalDecision === 'approve' ? 'closed' : 'reassigned'} successfully`
      }));
      navigate('/ims/incidents');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to process closure'
      }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentIncident) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Incident not found
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
            Incident Closure Approval
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentIncident.incidentNumber} - Review and approve incident closure
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/ims/incidents/${id}`)}
          >
            Back to Incident
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Submit Decision
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Incident Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Incident Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {currentIncident.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Severity
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                currentIncident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                currentIncident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                currentIncident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {currentIncident.severity.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-white">
              {currentIncident.description}
            </p>
          </div>
        </Card>

        {/* Closure Decision */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Closure Decision
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Decision *
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('approvalDecision', { required: 'Decision is required' })}
                    type="radio"
                    value="approve"
                    className="text-green-600 focus:ring-green-500"
                  />
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Approve Closure
                  </span>
                </label>

                <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('approvalDecision', { required: 'Decision is required' })}
                    type="radio"
                    value="reject"
                    className="text-red-600 focus:ring-red-500"
                  />
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Reject and Reassign
                  </span>
                </label>
              </div>
              {errors.approvalDecision && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.approvalDecision.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="closureComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Comments *
              </label>
              <textarea
                {...register('closureComments', { required: 'Comments are required' })}
                rows={4}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder={watchDecision === 'approve' ? 'Provide closure approval comments...' : 'Explain why closure is being rejected...'}
              />
              {errors.closureComments && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.closureComments.message}
                </p>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default IncidentClosure;