import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Play,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Lock,
  Users,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchPermitById, activatePermit } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

interface ActivationData {
  preWorkChecklist: boolean;
  lotoVerified: boolean;
  personnelBriefed: boolean;
  emergencyProcedures: boolean;
  activationComments: string;
}

const PermitActivation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);

  const { register, handleSubmit, formState: { errors } } = useForm<ActivationData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ActivationData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(activatePermit({
        companyId: user.companyId,
        id
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Permit activated successfully'
      }));
      navigate('/ptw/permits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to activate permit'
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

  if (currentPermit.status !== 'approved') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-24 w-24 text-yellow-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          Permit Not Ready for Activation
        </h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This permit must be fully approved before it can be activated.
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
            Activate Work Permit
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentPermit.permitNumber} - Complete pre-work verification and activate permit
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
        {/* Permit Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Work Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Work Summary
            </h2>
            
            <div className="space-y-4">
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
                    Work Period
                  </label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Start: {format(new Date(currentPermit.schedule?.startDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <Clock className="inline h-4 w-4 mr-1" />
                      End: {format(new Date(currentPermit.schedule?.endDate), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Work Types
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
              </div>
            </div>
          </Card>

          {/* Pre-Activation Checklist */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Pre-Activation Verification
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-start space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('preWorkChecklist', { required: 'Pre-work checklist verification is required' })}
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pre-Work Safety Checklist Completed
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      All safety checklist items have been verified and completed as per permit requirements
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('lotoVerified', { required: 'LOTO verification is required' })}
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 flex items-start space-x-2">
                    <Lock className="h-4 w-4 text-red-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        LOTO Procedures Verified
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        All required lockout/tagout procedures have been implemented and verified
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('personnelBriefed', { required: 'Personnel briefing confirmation is required' })}
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 flex items-start space-x-2">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        All Personnel Briefed
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Safety briefing has been conducted for all workers involved in the permit
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    {...register('emergencyProcedures', { required: 'Emergency procedures confirmation is required' })}
                    type="checkbox"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Emergency Procedures Known
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        All personnel are aware of emergency procedures and evacuation routes
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {(errors.preWorkChecklist || errors.lotoVerified || errors.personnelBriefed || errors.emergencyProcedures) && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Please complete all required verification items before activating the permit.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="activationComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Activation Comments
                </label>
                <textarea
                  {...register('activationComments')}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Any additional comments or observations before activation..."
                />
              </div>

              <Button
                type="submit"
                variant="success"
                className="w-full"
                loading={isLoading}
                icon={Play}
              >
                Activate Permit
              </Button>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Current Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  APPROVED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Requested by:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {currentPermit.requestedBy?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Plant:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {currentPermit.plantId?.name}
                </span>
              </div>
            </div>
          </Card>

          {/* Approval History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Approval History
            </h3>
            <div className="space-y-3">
              {currentPermit.approvals?.map((approval, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Step {approval.step} - {approval.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {approval.approver?.name} • {approval.timestamp ? format(new Date(approval.timestamp), 'MMM dd, HH:mm') : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Safety Reminder */}
          <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200">
                  Safety Reminder
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Once activated, this permit authorizes work to begin. Ensure all safety measures are in place and all personnel understand their responsibilities.
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>• Verify all LOTO procedures are complete</li>
                  <li>• Confirm PPE requirements are met</li>
                  <li>• Ensure emergency procedures are understood</li>
                  <li>• Monitor work area continuously</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PermitActivation;