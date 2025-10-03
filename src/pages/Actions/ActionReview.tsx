import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  Download,
  Eye
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ReviewData {
  reviewDecision: 'approve' | 'reject';
  reviewComments: string;
  reassignReason?: string;
}

const ActionReview: React.FC = () => {
  const { module, itemId, actionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [item, setItem] = useState<any>(null);
  const [action, setAction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ReviewData>();

  const watchDecision = watch('reviewDecision');

  useEffect(() => {
    fetchItemAndAction();
  }, [module, itemId, actionId]);

  const fetchItemAndAction = async () => {
    if (!user?.companyId || !module || !itemId) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${module}/${user.companyId}/${itemId}`);
      const itemData = response.data[Object.keys(response.data)[0]];
      setItem(itemData);

      // Find the specific action
      let foundAction = null;
      if (module === 'ims' && itemData.correctiveActions) {
        foundAction = itemData.correctiveActions.find((a: any) => a._id === actionId);
      } else if (module === 'bbs' && itemData.correctiveActions) {
        foundAction = itemData.correctiveActions.find((a: any) => a._id === actionId);
      } else if (module === 'audit' && itemData.findings) {
        const finding = itemData.findings.find((f: any) => f.correctiveAction?._id === actionId);
        foundAction = finding?.correctiveAction;
      }

      setAction(foundAction);
    } catch (error) {
      console.error('Error fetching item:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load action details'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ReviewData) => {
    if (!user?.companyId || !module || !itemId || !actionId) return;

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/${module}/${user.companyId}/${itemId}/actions/${actionId}/review`, data);
      
      dispatch(addNotification({
        type: 'success',
        message: `Action ${data.reviewDecision}d successfully`
      }));
      
      navigate(`/${module}/${module === 'ims' ? 'incidents' : module === 'bbs' ? 'observations' : 'audits'}/${itemId}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to review action'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !item) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!item || !action) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Action not found
        </h3>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
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
            Review and approve action completion
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Submit Review
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Action Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Action Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {action.action}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Completion Evidence
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                {action.completionEvidence}
              </p>
            </div>
            {action.completionPhotos && action.completionPhotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completion Photos
                </label>
                <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {action.completionPhotos.map((photo: string, index: number) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Completion evidence ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Review Decision */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Review Decision
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Decision *
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('reviewDecision', { required: 'Review decision is required' })}
                    type="radio"
                    value="approve"
                    className="text-green-600 focus:ring-green-500"
                  />
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Approve Completion
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Action has been completed satisfactorily
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('reviewDecision', { required: 'Review decision is required' })}
                    type="radio"
                    value="reject"
                    className="text-red-600 focus:ring-red-500"
                  />
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Reject and Reassign
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Action needs additional work or clarification
                    </p>
                  </div>
                </label>
              </div>
              {errors.reviewDecision && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.reviewDecision.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reviewComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Review Comments *
              </label>
              <textarea
                {...register('reviewComments', { required: 'Review comments are required' })}
                rows={4}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide detailed review comments..."
              />
              {errors.reviewComments && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.reviewComments.message}
                </p>
              )}
            </div>

            {watchDecision === 'reject' && (
              <div>
                <label htmlFor="reassignReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reason for Reassignment *
                </label>
                <textarea
                  {...register('reassignReason', { required: 'Reassignment reason is required' })}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Explain why this action needs additional work..."
                />
                {errors.reassignReason && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.reassignReason.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ActionReview;