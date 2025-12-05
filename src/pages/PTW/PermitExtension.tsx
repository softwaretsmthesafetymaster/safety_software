import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  Clock,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

interface ExtensionData {
  extensionHours: number;
  extensionReason: string;
  comments: string;
  safetyReviewCompleted: boolean;
}

const PermitExtension: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);

  const { register, handleSubmit, formState: { errors } } = useForm<ExtensionData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ExtensionData) => {
    if (!user?.companyId || !id) return;

    try {
      await axios.post(`${API_URL}/permits/${user.companyId}/${id}/extension`, data);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Permit extension requested successfully'
      }));
      navigate('/ptw/permits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to request extension'
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

  const canExtend = ['active', 'expired'].includes(currentPermit.status);

  if (!canExtend) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-yellow-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Extension Not Available
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This permit cannot be extended in its current status.
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
            Extend Work Permit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPermit.permitNumber} - Request permit time extension
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/ptw/permits/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Request Extension
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extension Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Schedule */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Current Schedule
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Original Start Time
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(currentPermit.schedule?.startDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current End Time
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {format(new Date(currentPermit.schedule?.endDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>

              {currentPermit.expiresAt && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Expires: {format(new Date(currentPermit.expiresAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {/* Extension Details */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Extension Request
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="extensionHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Extension Duration (Hours) *
                  </label>
                  <select
                    {...register('extensionHours', { required: 'Extension duration is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Extension Duration</option>
                    <option value="2">2 Hours</option>
                    <option value="4">4 Hours</option>
                    <option value="6">6 Hours</option>
                    <option value="8">8 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours</option>
                  </select>
                  {errors.extensionHours && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.extensionHours.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="extensionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Reason for Extension *
                  </label>
                  <select
                    {...register('extensionReason', { required: 'Extension reason is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Reason</option>
                    <option value="work_not_completed">Work Not Completed as Planned</option>
                    <option value="additional_work_identified">Additional Work Identified</option>
                    <option value="equipment_delay">Equipment Delivery Delay</option>
                    <option value="weather_conditions">Weather Conditions</option>
                    <option value="technical_complications">Technical Complications</option>
                    <option value="safety_precaution">Additional Safety Precautions Required</option>
                    <option value="other">Other Reason</option>
                  </select>
                  {errors.extensionReason && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.extensionReason.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="comments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Detailed Comments *
                  </label>
                  <textarea
                    {...register('comments', { required: 'Comments are required' })}
                    rows={4}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Provide detailed explanation for the extension request, current work status, and any safety considerations..."
                  />
                  {errors.comments && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.comments.message}</p>
                  )}
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <label className="flex items-start space-x-3">
                    <input
                      {...register('safetyReviewCompleted', { required: 'Safety review confirmation is required' })}
                      type="checkbox"
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Safety Review Completed *
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        I confirm that all safety conditions remain valid and appropriate for the extended work period. All hazards have been re-evaluated and mitigation measures remain effective.
                      </p>
                    </div>
                  </label>
                  {errors.safetyReviewCompleted && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.safetyReviewCompleted.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Permit Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Permit Information
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`font-medium ${
                  currentPermit.status === 'active' ? 'text-green-600 dark:text-green-400' :
                  currentPermit.status === 'expired' ? 'text-red-600 dark:text-red-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {currentPermit.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Work Type:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.types?.join(', ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-gray-900 dark:text-white">
                  {currentPermit.plantId?.name}
                </span>
              </div>
            </div>
          </Card>

          {/* Extension History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Extension History
            </h3>
            {currentPermit.extensions && currentPermit.extensions.length > 0 ? (
              <div className="space-y-3">
                {currentPermit.extensions.map((extension: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          +{extension.hours} hours
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {extension.approvedAt ? format(new Date(extension.approvedAt), 'MMM dd, yyyy') : 'Pending'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        extension.approvedAt
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {extension.approvedAt ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    {extension.comments && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {extension.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No previous extensions
              </p>
            )}
          </Card>

          {/* Extension Guidelines */}
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                  Extension Guidelines
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                  <li>• Extensions must be approved by authorized personnel</li>
                  <li>• Safety conditions must be re-evaluated</li>
                  <li>• Maximum extension period may be limited</li>
                  <li>• Work must remain within original scope</li>
                  <li>• Additional safety measures may be required</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermitExtension;