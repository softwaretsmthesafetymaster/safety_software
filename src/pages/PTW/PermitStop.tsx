import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Shield,
  Users
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById, stopPermit } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';

interface StopData {
  stopReason: string;
  safetyIssue: string;
  immediateActions: string;
  stopComments: string;
  notifyPersonnel: string[];
}

const PermitStop: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const { currentCompany } = useAppSelector((state) => state.company);

  const { register, handleSubmit, formState: { errors } } = useForm<StopData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: StopData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(stopPermit({
        companyId: user.companyId,
        id,
        stopData: data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'warning',
        message: 'Permit has been stopped due to safety concerns'
      }));
      navigate('/ptw/permits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to stop permit'
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

  // Check if user can stop work
  const canStopWork = 
  currentPermit?.status === 'active' &&
  Array.isArray(currentPermit?.stopWorkRoles) &&
  currentPermit.stopWorkRoles.some(r => r.role === user.role);

  if (!canStopWork) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Access Denied
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You don't have permission to stop work permits.
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
            Emergency Stop Work Permit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPermit.permitNumber} - Stop work due to safety concerns
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
            variant="danger"
            icon={XCircle}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Stop Work Immediately
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Warning Notice */}
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Emergency Stop Work Notice
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                This action will immediately stop all work under this permit and notify all relevant personnel. 
                Use only in case of safety emergencies or when work cannot continue safely.
              </p>
              <div className="mt-3 p-3 bg-red-100 dark:bg-red-800/30 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  Current Permit Status: {currentPermit.status.toUpperCase()}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Work Period: {new Date(currentPermit.schedule?.startDate).toLocaleString()} - {new Date(currentPermit.schedule?.endDate).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stop Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Stop Work Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="stopReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primary Reason for Stopping Work *
              </label>
              <select
                {...register('stopReason', { required: 'Stop reason is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Primary Reason</option>
                <option value="safety_hazard">Immediate Safety Hazard Identified</option>
                <option value="equipment_failure">Critical Equipment Failure</option>
                <option value="weather_conditions">Adverse Weather Conditions</option>
                <option value="emergency_situation">Emergency Situation</option>
                <option value="procedure_violation">Serious Procedure Violation</option>
                <option value="personnel_safety">Personnel Safety Concern</option>
                <option value="environmental_risk">Environmental Risk</option>
                <option value="other">Other Critical Safety Issue</option>
              </select>
              {errors.stopReason && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.stopReason.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="safetyIssue" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Detailed Safety Issue Description *
              </label>
              <textarea
                {...register('safetyIssue', { required: 'Safety issue description is required', minLength: { value: 20, message: 'Please provide detailed description (minimum 20 characters)' } })}
                rows={5}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide a detailed description of the safety issue or hazard that requires immediate work stoppage. Include specific conditions, equipment involved, and potential consequences..."
              />
              {errors.safetyIssue && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.safetyIssue.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="immediateActions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Immediate Actions Taken *
              </label>
              <textarea
                {...register('immediateActions', { required: 'Immediate actions are required' })}
                rows={4}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe immediate actions taken to secure the area, protect personnel, and mitigate risks..."
              />
              {errors.immediateActions && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.immediateActions.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="stopComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Comments
              </label>
              <textarea
                {...register('stopComments')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Any additional information, recommendations for resuming work, or lessons learned..."
              />
            </div>
          </div>
        </Card>

        {/* Personnel Notification */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Personnel Notification
          </h2>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Automatic Notifications
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  The following personnel will be automatically notified:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>• Permit requestor and all workers</li>
                  <li>• Area supervisors and safety personnel</li>
                  <li>• Plant management and emergency response team</li>
                  <li>• All personnel in the affected area</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Photo Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Evidence Photos
          </h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="evidence-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Upload photos of the safety issue
                </span>
                <input id="evidence-upload" name="evidence-upload" type="file" className="sr-only" multiple accept="image/*" />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG up to 10MB each. Document the safety issue, area conditions, and any damage or hazards.
              </p>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default PermitStop;