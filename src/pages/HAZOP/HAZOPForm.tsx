import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Search,
  Users,
  FileText,
  Lightbulb
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHAZOPStudy, updateHAZOPStudy, fetchHAZOPById, getAISuggestions } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface HAZOPFormData {
  title: string;
  description: string;
  methodology: string;
  plantId: string;
  studyBoundary: {
    startPoint: string;
    endPoint: string;
    inclusions: string[];
    exclusions: string[];
  };
  process: {
    name: string;
    description: string;
    operatingConditions: {
      temperature: { min: number; max: number; unit: string };
      pressure: { min: number; max: number; unit: string };
      flowRate: { min: number; max: number; unit: string };
    };
  };
  team: Array<{
    member: string;
    role: string;
    expertise: string;
  }>;
}

const HAZOPForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading } = useAppSelector((state) => state.hazop);
  const { plants } = useAppSelector((state) => state.plant);
  const { users } = useAppSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('basic');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<HAZOPFormData>({
    defaultValues: {
      methodology: 'HAZOP',
      team: [{ member: '', role: '', expertise: '' }],
      studyBoundary: {
        inclusions: [''],
        exclusions: ['']
      },
      process: {
        operatingConditions: {
          temperature: { unit: '°C' },
          pressure: { unit: 'bar' },
          flowRate: { unit: 'm³/h' }
        }
      }
    }
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'team'
  });

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentStudy && isEdit) {
      setValue('title', currentStudy.title || '');
      setValue('description', currentStudy.description || '');
      setValue('methodology', currentStudy.methodology || 'HAZOP');
      setValue('plantId', currentStudy.plantId?._id || '');
    }
  }, [currentStudy, isEdit, setValue]);

  const onSubmit = async (data: HAZOPFormData) => {
    if (!user?.companyId) return;

    try {
      if (isEdit && id) {
        await dispatch(updateHAZOPStudy({
          companyId: user.companyId,
          id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'HAZOP study updated successfully'
        }));
      } else {
        await dispatch(createHAZOPStudy({
          companyId: user.companyId,
          studyData: data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'HAZOP study created successfully'
        }));
      }
      navigate('/hazop/studies');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save HAZOP study'
      }));
    }
  };

  const methodologies = [
    { value: 'HAZOP', label: 'HAZOP' },
    { value: 'WHAT-IF', label: 'What-If Analysis' },
    { value: 'CHECKLIST', label: 'Checklist Analysis' },
    { value: 'FMEA', label: 'FMEA' },
  ];

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: FileText },
    { id: 'process', name: 'Process Details', icon: Search },
    { id: 'team', name: 'Study Team', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit HAZOP Study' : 'New HAZOP Study'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update study details' : 'Create a new hazard and operability study'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/hazop/studies')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Update' : 'Create'} Study
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Study Title *
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter study title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="methodology" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Methodology *
                  </label>
                  <select
                    {...register('methodology', { required: 'Methodology is required' })}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {methodologies.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                  {errors.methodology && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.methodology.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe the study scope and objectives..."
                />
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
                      {plant.name} ({plant.code})
                    </option>
                  ))}
                </select>
                {errors.plantId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.plantId.message}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Process Details Tab */}
          {activeTab === 'process' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div>
                <label htmlFor="process.name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Process Name *
                </label>
                <input
                  {...register('process.name', { required: 'Process name is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter process name"
                />
                {errors.process?.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.process.name.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="process.description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Process Description
                </label>
                <textarea
                  {...register('process.description')}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe the process in detail..."
                />
              </div>

              {/* Operating Conditions */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Operating Conditions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temperature
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        {...register('process.operatingConditions.temperature.min', { valueAsNumber: true })}
                        type="number"
                        placeholder="Min"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.temperature.max', { valueAsNumber: true })}
                        type="number"
                        placeholder="Max"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.temperature.unit')}
                        type="text"
                        placeholder="Unit"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pressure
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        {...register('process.operatingConditions.pressure.min', { valueAsNumber: true })}
                        type="number"
                        placeholder="Min"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.pressure.max', { valueAsNumber: true })}
                        type="number"
                        placeholder="Max"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.pressure.unit')}
                        type="text"
                        placeholder="Unit"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Flow Rate
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        {...register('process.operatingConditions.flowRate.min', { valueAsNumber: true })}
                        type="number"
                        placeholder="Min"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.flowRate.max', { valueAsNumber: true })}
                        type="number"
                        placeholder="Max"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        {...register('process.operatingConditions.flowRate.unit')}
                        type="text"
                        placeholder="Unit"
                        className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Study Team
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => appendTeam({ member: '', role: '', expertise: '' })}
                >
                  Add Team Member
                </Button>
              </div>
              <div className="space-y-4">
                {teamFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Team Member
                      </label>
                      <select
                        {...register(`team.${index}.member` as const)}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Member</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Role in Study
                      </label>
                      <input
                        {...register(`team.${index}.role` as const)}
                        type="text"
                        placeholder="e.g., Process Engineer"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Expertise
                      </label>
                      <input
                        {...register(`team.${index}.expertise` as const)}
                        type="text"
                        placeholder="Area of expertise"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        onClick={() => removeTeam(index)}
                        disabled={teamFields.length === 1}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </Card>
      </form>
    </div>
  );
};

export default HAZOPForm;