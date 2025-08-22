import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  MapPin,
  Users,
  Camera,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createIncident, updateIncident, fetchIncidentById } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface IncidentFormData {
  type: string;
  severity: string;
  classification?: string;
  dateTime: string;
  location: {
    area: string;
    specificLocation: string;
  };
  description: string;
  immediateActions: string;
  affectedPersons: Array<{
    name: string;
    role: string;
    injuryDetails: string;
    bodyPart: string;
    medicalAttention: boolean;
  }>;
  witnesses: Array<{
    name: string;
    contact: string;
    statement: string;
  }>;
  plantId: string;
}

const IncidentForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);
  const [activeTab, setActiveTab] = useState('basic');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<IncidentFormData>({
    defaultValues: {
      affectedPersons: [{ name: '', role: '', injuryDetails: '', bodyPart: '', medicalAttention: false }],
      witnesses: [{ name: '', contact: '', statement: '' }],
    }
  });

  const { fields: affectedFields, append: appendAffected, remove: removeAffected } = useFieldArray({
    control,
    name: 'affectedPersons'
  });

  const { fields: witnessFields, append: appendWitness, remove: removeWitness } = useFieldArray({
    control,
    name: 'witnesses'
  });

  const watchType = watch('type');

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentIncident && isEdit) {
      setValue('type', currentIncident.type || '');
      setValue('severity', currentIncident.severity || '');
      setValue('classification', currentIncident.classification || '');
      setValue('dateTime', currentIncident.dateTime ? new Date(currentIncident.dateTime).toISOString().slice(0, 16) : '');
      setValue('location', currentIncident.location || { area: '', specificLocation: '' });
      setValue('description', currentIncident.description || '');
      setValue('immediateActions', currentIncident.immediateActions || '');
      setValue('plantId', currentIncident.plantId?._id || '');
    }
  }, [currentIncident, isEdit, setValue]);

  const onSubmit = async (data: IncidentFormData) => {
    if (!user?.companyId) return;

    try {
      if (isEdit && id) {
        await dispatch(updateIncident({
          companyId: user.companyId,
          id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Incident updated successfully'
        }));
      } else {
        await dispatch(createIncident({
          companyId: user.companyId,
          incidentData: data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Incident reported successfully'
        }));
      }
      navigate('/ims/incidents');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save incident'
      }));
    }
  };

  const incidentTypes = [
    { value: 'injury', label: 'Injury' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'property_damage', label: 'Property Damage' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'security', label: 'Security' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'critical', label: 'Critical', color: 'text-red-600' },
  ];

  const classificationOptions = [
    { value: 'first_aid', label: 'First Aid' },
    { value: 'medical_treatment', label: 'Medical Treatment' },
    { value: 'lost_time', label: 'Lost Time' },
    { value: 'fatality', label: 'Fatality' },
  ];

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: AlertTriangle },
    { id: 'location', name: 'Location & Time', icon: MapPin },
    { id: 'people', name: 'People Involved', icon: Users },
    { id: 'details', name: 'Details', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Incident' : 'Report Incident'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update incident details' : 'Report a new safety incident'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/ims/incidents')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Update' : 'Report Incident'}
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
              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Incident Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {incidentTypes.map((type) => (
                    <label key={type.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        {...register('type', { required: 'Incident type is required' })}
                        value={type.value}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Severity Level *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {severityLevels.map((level) => (
                    <label key={level.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        {...register('severity', { required: 'Severity level is required' })}
                        value={level.value}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm font-medium ${level.color}`}>
                        {level.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.severity && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.severity.message}
                  </p>
                )}
              </div>

              {/* Classification (for injury incidents) */}
              {watchType === 'injury' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Injury Classification
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {classificationOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          {...register('classification')}
                          value={option.value}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Incident Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe what happened in detail..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Immediate Actions */}
              <div>
                <label htmlFor="immediateActions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Immediate Actions Taken
                </label>
                <textarea
                  {...register('immediateActions')}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe immediate actions taken after the incident..."
                />
              </div>
            </motion.div>
          )}

          {/* Location & Time Tab */}
          {activeTab === 'location' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Date and Time */}
              <div>
                <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date and Time of Incident *
                </label>
                <input
                  {...register('dateTime', { required: 'Date and time is required' })}
                  type="datetime-local"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
                {errors.dateTime && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.dateTime.message}
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
            </motion.div>
          )}

          {/* People Involved Tab */}
          {activeTab === 'people' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Affected Persons */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Affected Persons
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => appendAffected({ name: '', role: '', injuryDetails: '', bodyPart: '', medicalAttention: false })}
                  >
                    Add Person
                  </Button>
                </div>
                <div className="space-y-4">
                  {affectedFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          {...register(`affectedPersons.${index}.name` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Role
                        </label>
                        <input
                          {...register(`affectedPersons.${index}.role` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Injury Details
                        </label>
                        <input
                          {...register(`affectedPersons.${index}.injuryDetails` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Body Part
                        </label>
                        <input
                          {...register(`affectedPersons.${index}.bodyPart` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <input
                          {...register(`affectedPersons.${index}.medicalAttention` as const)}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Medical Attention
                        </label>
                      </div>
                      <div className="flex items-center pt-6">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeAffected(index)}
                          disabled={affectedFields.length === 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Witnesses */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Witnesses
                  </h3>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => appendWitness({ name: '', contact: '', statement: '' })}
                  >
                    Add Witness
                  </Button>
                </div>
                <div className="space-y-4">
                  {witnessFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          {...register(`witnesses.${index}.name` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Contact
                        </label>
                        <input
                          {...register(`witnesses.${index}.contact` as const)}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Statement
                        </label>
                        <textarea
                          {...register(`witnesses.${index}.statement` as const)}
                          rows={2}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeWitness(index)}
                          disabled={witnessFields.length === 1}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-6"
            >
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Photos/Evidence
                </label>
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
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Additional Notes
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Any additional information about the incident..."
                />
              </div>
            </motion.div>
          )}
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/ims/incidents')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isLoading}
          >
            {isEdit ? 'Update Incident' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IncidentForm;