import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById, updateIncident } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface ActionsData {
  correctiveActions: Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
    status: string;
    completedDate?: string;
    evidence?: string;
  }>;
}

const IncidentActions: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);
  const { users } = useAppSelector((state) => state.user);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<ActionsData>({
    defaultValues: {
      correctiveActions: [
        {
          action: '',
          assignedTo: '',
          dueDate: '',
          status: 'pending'
        }
      ]
    }
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } = useFieldArray({
    control,
    name: 'correctiveActions'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ActionsData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateIncident({
        companyId: user.companyId,
        id,
        data: {
          ...data,
          status: 'actions_assigned'
        }
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Corrective actions updated successfully'
      }));
      navigate(`/ims/incidents/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update actions'
      }));
    }
  };

  const actionStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Corrective Actions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentIncident?.incidentNumber} - Assign and track corrective actions
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
            Save Actions
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Corrective Actions
            </h2>
            <Button
              type="button"
              variant="secondary"
              icon={Plus}
              onClick={() => appendAction({
                action: '',
                assignedTo: '',
                dueDate: '',
                status: 'pending'
              })}
            >
              Add Action
            </Button>
          </div>

          <div className="space-y-6">
            {actionFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Action {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeAction(index)}
                    disabled={actionFields.length === 1}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Corrective Action *
                    </label>
                    <textarea
                      {...register(`correctiveActions.${index}.action` as const, { required: 'Action is required' })}
                      rows={3}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Describe the corrective action to be taken..."
                    />
                    {errors.correctiveActions?.[index]?.action && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.correctiveActions[index]?.action?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assigned To *
                      </label>
                      <select
                        {...register(`correctiveActions.${index}.assignedTo` as const, { required: 'Assignment is required' })}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Person</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                      {errors.correctiveActions?.[index]?.assignedTo && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.correctiveActions[index]?.assignedTo?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Due Date *
                      </label>
                      <input
                        {...register(`correctiveActions.${index}.dueDate` as const, { required: 'Due date is required' })}
                        type="date"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      {errors.correctiveActions?.[index]?.dueDate && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {errors.correctiveActions[index]?.dueDate?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <select
                        {...register(`correctiveActions.${index}.status` as const)}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {actionStatuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {watch(`correctiveActions.${index}.status`) === 'completed' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Completion Date
                        </label>
                        <input
                          {...register(`correctiveActions.${index}.completedDate` as const)}
                          type="date"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Evidence of Completion
                        </label>
                        <input
                          {...register(`correctiveActions.${index}.evidence` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Provide evidence..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Action Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Action Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-200">
                    {actionFields.filter((_, i) => watch(`correctiveActions.${i}.status`) === 'pending').length}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending Actions</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-200">
                    {actionFields.filter((_, i) => watch(`correctiveActions.${i}.status`) === 'in_progress').length}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">In Progress</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-200">
                    {actionFields.filter((_, i) => watch(`correctiveActions.${i}.status`) === 'completed').length}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default IncidentActions;