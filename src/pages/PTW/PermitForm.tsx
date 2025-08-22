import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Send,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createPermit, updatePermit, fetchPermitById } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface PermitFormData {
  types: string[];
  workDescription: string;
  location: {
    area: string;
    specificLocation: string;
  };
  contractor: {
    name: string;
    contact: string;
    license: string;
  };
  workers: Array<{
    name: string;
    id: string;
    contact: string;
    medicalFitness: boolean;
  }>;
  schedule: {
    startDate: string;
    endDate: string;
    shift: string;
  };
  hazards: Array<{
    type: string;
    mitigation: string;
  }>;
  ppe: Array<{
    item: string;
    required: boolean;
  }>;
  safetyChecklist: Array<{
    item: string;
    checked: boolean;
    remarks: string;
  }>;
  plantId: string;
}

const PermitForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const [activeTab, setActiveTab] = useState('basic');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PermitFormData>({
    defaultValues: {
      types: [],
      workers: [{ name: '', id: '', contact: '', medicalFitness: false }],
      hazards: [{ type: '', mitigation: '' }],
      ppe: [
        { item: 'Hard Hat', required: true },
        { item: 'Safety Glasses', required: true },
        { item: 'Gloves', required: true },
        { item: 'Safety Shoes', required: true },
      ],
      safetyChecklist: [
        { item: 'Area isolated and secured', checked: false, remarks: '' },
        { item: 'Equipment locked out/tagged out', checked: false, remarks: '' },
        { item: 'Emergency procedures briefed', checked: false, remarks: '' },
        { item: 'Communication established', checked: false, remarks: '' },
      ],
    }
  });

  const { fields: workerFields, append: appendWorker, remove: removeWorker } = useFieldArray({
    control,
    name: 'workers'
  });

  const { fields: hazardFields, append: appendHazard, remove: removeHazard } = useFieldArray({
    control,
    name: 'hazards'
  });

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentPermit && isEdit) {
      // Populate form with existing permit data
      setValue('types', currentPermit.types || []);
      setValue('workDescription', currentPermit.workDescription || '');
      setValue('location', currentPermit.location || { area: '', specificLocation: '' });
      setValue('contractor', currentPermit.contractor || { name: '', contact: '', license: '' });
      setValue('schedule', {
        startDate: currentPermit.schedule?.startDate ? new Date(currentPermit.schedule.startDate).toISOString().split('T')[0] : '',
        endDate: currentPermit.schedule?.endDate ? new Date(currentPermit.schedule.endDate).toISOString().split('T')[0] : '',
        shift: currentPermit.schedule?.shift || ''
      });
      setValue('plantId', currentPermit.plantId?._id || '');
    }
  }, [currentPermit, isEdit, setValue]);

  const onSubmit = async (data: PermitFormData) => {
    if (!user?.companyId) return;
    try {
      if (isEdit && id) {
        await dispatch(updatePermit({
          companyId: user.companyId,
          id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Permit updated successfully'
        }));
      } else {
        await dispatch(createPermit({
          companyId: user.companyId,
          permitData: data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Permit created successfully'
        }));
      }
      navigate('/ptw/permits');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save permit'
      }));
    }
  };

  const permitTypes = [
    { value: 'hot_work', label: 'Hot Work' },
    { value: 'cold_work', label: 'Cold Work' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'working_at_height', label: 'Working at Height' },
    { value: 'confined_space', label: 'Confined Space' },
    { value: 'excavation', label: 'Excavation' },
  ];

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: MapPin },
    { id: 'personnel', name: 'Personnel', icon: Users },
    { id: 'safety', name: 'Safety', icon: Shield },
    { id: 'checklist', name: 'Checklist', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Permit' : 'New Permit'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update permit details' : 'Create a new work permit'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/ptw/permits')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Update' : 'Save Draft'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tabs */}
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
              {/* Permit Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Permit Types *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {permitTypes.map((type) => (
                    <label key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        {...register('types', { required: 'At least one permit type is required' })}
                        value={type.value}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.types && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.types.message}
                  </p>
                )}
              </div>

              {/* Work Description */}
              <div>
                <label htmlFor="workDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Work Description *
                </label>
                <textarea
                  {...register('workDescription', { required: 'Work description is required' })}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe the work to be performed..."
                />
                {errors.workDescription && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.workDescription.message}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="e.g., Near Reactor R-101"
                  />
                </div>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="schedule.startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date *
                  </label>
                  <input
                    {...register('schedule.startDate', { required: 'Start date is required' })}
                    type="date"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.schedule?.startDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.schedule.startDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="schedule.endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date *
                  </label>
                  <input
                    {...register('schedule.endDate', { required: 'End date is required' })}
                    type="date"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.schedule?.endDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.schedule.endDate.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="schedule.shift" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Shift
                  </label>
                  <select
                    {...register('schedule.shift')}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Shift</option>
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="24hour">24 Hour</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Personnel Tab */}
          {activeTab === 'personnel' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Contractor Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Contractor Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="contractor.name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contractor Name *
                    </label>
                    <input
                      {...register('contractor.name', { required: 'Contractor name is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                    {errors.contractor?.name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.contractor.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contractor.contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Number
                    </label>
                    <input
                      {...register('contractor.contact')}
                      type="tel"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="contractor.license" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      License Number
                    </label>
                    <input
                      {...register('contractor.license')}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Workers */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Workers
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => appendWorker({ name: '', id: '', contact: '', medicalFitness: false })}
                  >
                    Add Worker
                  </Button>
                </div>
                <div className="space-y-4">
                  {workerFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          {...register(`workers.${index}.name` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          ID
                        </label>
                        <input
                          {...register(`workers.${index}.id` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact
                        </label>
                        <input
                          {...register(`workers.${index}.contact` as const)}
                          type="tel"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <input
                          {...register(`workers.${index}.medicalFitness` as const)}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Medical Fitness
                        </label>
                      </div>
                      <div className="flex items-center pt-6">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeWorker(index)}
                          disabled={workerFields.length === 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Safety Tab */}
          {activeTab === 'safety' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Hazards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Identified Hazards
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => appendHazard({ type: '', mitigation: '' })}
                  >
                    Add Hazard
                  </Button>
                </div>
                <div className="space-y-4">
                  {hazardFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Hazard Type
                        </label>
                        <select
                          {...register(`hazards.${index}.type` as const)}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Hazard</option>
                          <option value="fire">Fire/Explosion</option>
                          <option value="chemical">Chemical Exposure</option>
                          <option value="electrical">Electrical</option>
                          <option value="fall">Fall from Height</option>
                          <option value="struck">Struck by Object</option>
                          <option value="caught">Caught in/between</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Mitigation Measures
                        </label>
                        <input
                          {...register(`hazards.${index}.mitigation` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Control measures..."
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeHazard(index)}
                          disabled={hazardFields.length === 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PPE Requirements */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  PPE Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watch('ppe')?.map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <input
                          {...register(`ppe.${index}.required` as const)}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          <input
                            {...register(`ppe.${index}.item` as const)}
                            type="text"
                            className="border-0 bg-transparent p-0 focus:ring-0 text-sm"
                            placeholder="PPE item"
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Safety Checklist
                </h3>
                <div className="space-y-4">
                  {watch('safetyChecklist')?.map((_, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <input
                          {...register(`safetyChecklist.${index}.checked` as const)}
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <input
                            {...register(`safetyChecklist.${index}.item` as const)}
                            type="text"
                            className="block w-full border-0 bg-transparent p-0 focus:ring-0 text-sm font-medium text-gray-900 dark:text-white"
                            placeholder="Checklist item"
                          />
                          <textarea
                            {...register(`safetyChecklist.${index}.remarks` as const)}
                            rows={2}
                            className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                            placeholder="Remarks (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/ptw/permits')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isLoading}
          >
            {isEdit ? 'Update Permit' : 'Save Draft'}
          </Button>
          {!isEdit && (
            <Button
              type="button"
              variant="success"
              icon={Send}
              onClick={handleSubmit((data) => {
                // Submit for approval
                onSubmit({ ...data, status: 'submitted' });
              })}
            >
              Submit for Approval
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PermitForm;