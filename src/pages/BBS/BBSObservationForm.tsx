import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Camera
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createBBSReport } from '../../store/slices/bbsSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface BBSFormData {
  observationDate: string;
  location: {
    area: string;
    specificLocation: string;
  };
  observedPersons: Array<{
    name: string;
    designation: string;
    department: string;
  }>;
  observationType: string;
  category: string;
  description: string;
  severity: string;
  immediateAction: string;
  rootCause: string;
  correctiveActions: Array<{
    action: string;
    assignedTo: string;
    dueDate: string;
  }>;
  feedback: {
    given: boolean;
    method: string;
    response: string;
  };
  plantId: string;
}

const BBSObservationForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.bbs);
  const { plants } = useAppSelector((state) => state.plant);
  const { users } = useAppSelector((state) => state.user);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<BBSFormData>({
    defaultValues: {
      observedPersons: [{ name: '', designation: '', department: '' }],
      correctiveActions: [{ action: '', assignedTo: '', dueDate: '' }],
      feedback: { given: false, method: '', response: '' }
    }
  });

  const { fields: personFields, append: appendPerson, remove: removePerson } = useFieldArray({
    control,
    name: 'observedPersons'
  });

  const { fields: actionFields, append: appendAction, remove: removeAction } = useFieldArray({
    control,
    name: 'correctiveActions'
  });

  const watchObservationType = watch('observationType');

  const onSubmit = async (data: BBSFormData) => {
    if (!user?.companyId) return;

    try {
      await dispatch(createBBSReport({
        companyId: user.companyId,
        reportData: data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'BBS observation reported successfully'
      }));
      navigate('/bbs/observations');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to create observation'
      }));
    }
  };

  const observationTypes = [
    { value: 'unsafe_act', label: 'Unsafe Act', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'unsafe_condition', label: 'Unsafe Condition', icon: AlertTriangle, color: 'text-orange-500' },
    { value: 'safe_behavior', label: 'Safe Behavior', icon: CheckCircle, color: 'text-green-500' },
  ];

  const unsafeActCategories = [
    'PPE not used',
    'Wrong procedure',
    'Unsafe position',
    'Operating without authority',
    'Operating at unsafe speed',
    'Making safety devices inoperative'
  ];

  const unsafeConditionCategories = [
    'Defective equipment',
    'Inadequate guards/barriers',
    'Defective PPE',
    'Poor housekeeping',
    'Hazardous environmental conditions',
    'Inadequate warning systems'
  ];

  const safeBehaviorCategories = [
    'Proper PPE usage',
    'Following procedures',
    'Good housekeeping',
    'Safety awareness',
    'Proactive safety behavior',
    'Helping others with safety'
  ];

  const getCategories = () => {
    switch (watchObservationType) {
      case 'unsafe_act':
        return unsafeActCategories;
      case 'unsafe_condition':
        return unsafeConditionCategories;
      case 'safe_behavior':
        return safeBehaviorCategories;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            BBS Observation Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Report behavioral safety observations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/bbs/observations')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Save Observation
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Observation Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="observationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Observation Date *
              </label>
              <input
                {...register('observationDate', { required: 'Date is required' })}
                type="datetime-local"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.observationDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.observationDate.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="plantId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Plant *
              </label>
              <select
                {...register('plantId', { required: 'Plant is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Plant</option>
                {plants.map((plant) => (
                  <option key={plant._id} value={plant._id}>
                    {plant.name}
                  </option>
                ))}
              </select>
              {errors.plantId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plantId.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="severity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Severity *
              </label>
              <select
                {...register('severity', { required: 'Severity is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Severity</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.severity.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="location.area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area *
              </label>
              <input
                {...register('location.area', { required: 'Area is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Production Unit 1"
              />
              {errors.location?.area && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.location.area.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="location.specificLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specific Location
              </label>
              <input
                {...register('location.specificLocation')}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Specific location details"
              />
            </div>
          </div>
        </Card>

        {/* Observation Type */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Observation Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {observationTypes.map((type) => (
              <label key={type.value} className="relative">
                <input
                  {...register('observationType', { required: 'Observation type is required' })}
                  type="radio"
                  value={type.value}
                  className="sr-only"
                />
                <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  watchObservationType === type.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}>
                  <div className="flex items-center space-x-3">
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {watchObservationType && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Category</option>
                {getCategories().map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.category.message}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Detailed Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Describe what you observed in detail..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>
        </Card>

        {/* Observed Persons */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Observed Persons
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendPerson({ name: '', designation: '', department: '' })}
            >
              Add Person
            </Button>
          </div>
          
          <div className="space-y-4">
            {personFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    {...register(`observedPersons.${index}.name` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Designation
                  </label>
                  <input
                    {...register(`observedPersons.${index}.designation` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <input
                    {...register(`observedPersons.${index}.department` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removePerson(index)}
                    disabled={personFields.length === 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Actions and Feedback */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actions & Feedback
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="immediateAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Immediate Action Taken
              </label>
              <textarea
                {...register('immediateAction')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe immediate actions taken..."
              />
            </div>

            <div>
              <label htmlFor="rootCause" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Root Cause Analysis
              </label>
              <textarea
                {...register('rootCause')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Identify the root cause..."
              />
            </div>

            {/* Corrective Actions */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  Corrective Actions
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => appendAction({ action: '', assignedTo: '', dueDate: '' })}
                >
                  Add Action
                </Button>
              </div>
              
              <div className="space-y-4">
                {actionFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Action
                      </label>
                      <input
                        {...register(`correctiveActions.${index}.action` as const)}
                        type="text"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assigned To
                      </label>
                      <select
                        {...register(`correctiveActions.${index}.assignedTo` as const)}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select User</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Due Date
                      </label>
                      <input
                        {...register(`correctiveActions.${index}.dueDate` as const)}
                        type="date"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => removeAction(index)}
                        disabled={actionFields.length === 1}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback */}
            <div>
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Feedback Given
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('feedback.given')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Feedback was given to observed person(s)
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="feedback.method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Feedback Method
                    </label>
                    <select
                      {...register('feedback.method')}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Method</option>
                      <option value="verbal">Verbal</option>
                      <option value="written">Written</option>
                      <option value="demonstration">Demonstration</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="feedback.response" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Response Received
                    </label>
                    <input
                      {...register('feedback.response')}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="How did they respond?"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Photo Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Photos/Evidence
          </h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Upload photos or documents
                </span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*,.pdf,.doc,.docx" />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG, PDF up to 10MB each
              </p>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default BBSObservationForm;