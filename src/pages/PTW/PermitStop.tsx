import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
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
import { format } from 'date-fns';

interface StopData {
  stopReason: string;
  safetyIssue: string;
  immediateActions: string;
  stopComments: string;
  notifyPersonnel?: string[];
}

const PermitStop: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<StopData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: StopData) => {
    if (!user?.companyId || !id) return;

    setIsSubmitting(true);
    try {
      await dispatch(stopPermit({
        companyId: user.companyId,
        id,
        stopData: data
      })).unwrap();
      
      toast.success('Permit has been stopped due to safety concerns');
      navigate('/ptw/permits');
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop permit');
    } finally {
      setIsSubmitting(false);
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
  const canStopWork = currentPermit?.status === 'active' &&
    (currentPermit?.stopWorkRoles?.some(r => r.role === user?.role) ||
     ['hod', 'safety_incharge', 'plant_head', 'admin'].includes(user?.role || ''));

  if (!canStopWork) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-red-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Access Denied
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          You don't have permission to stop work permits or this permit is not active.
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
            loading={isSubmitting}
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
                  Work Period: {format(new Date(currentPermit.schedule?.startDate), 'MMM dd, yyyy HH:mm')} - {format(new Date(currentPermit.schedule?.endDate), 'MMM dd, yyyy HH:mm')}
                </p>
                {currentPermit.expiresAt && (
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Permit Expires: {format(new Date(currentPermit.expiresAt), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Permit Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Permit Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Work Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {currentPermit.workDescription}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Location
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {currentPermit.areaId?.name} - {currentPermit.location?.area}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Workers Involved
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {currentPermit.workers?.length || 0} workers
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contractor
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {currentPermit.contractor?.name}
              </p>
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
                {...register('safetyIssue', { 
                  required: 'Safety issue description is required', 
                  minLength: { value: 20, message: 'Please provide detailed description (minimum 20 characters)' } 
                })}
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

        

        {/* Photo Upload */}
        {/* <Card className="p-6">
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
        </Card> */}

        {/* Confirmation */}
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Confirmation Required
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                By submitting this form, you confirm that:
              </p>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1">
                <li>• There is an immediate safety concern requiring work stoppage</li>
                <li>• All personnel have been evacuated from the danger area</li>
                <li>• Immediate actions have been taken to secure the area</li>
                <li>• This decision is made in the interest of personnel safety</li>
              </ul>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default PermitStop;