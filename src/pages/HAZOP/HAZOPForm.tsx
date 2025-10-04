import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  Image,
  Users,
  Send
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHAZOPStudy, updateHAZOPStudy, fetchHAZOPById } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import axios from 'axios';
import { getArea } from '../../store/slices/plantSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface HAZOPFormData {
  title: string;
  description: string;
  methodology: string;
  plantId: string;
  areaId: string;
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
    drawings: Array<{
      name: string;
      url: string;
      type: string;
    }>;
  };
  team: Array<{
    member: string;
    role: string;
    expertise: string;
  }>;
  chairman: string;
  scribe: string;
  scheduledMeetings: Array<{
    date: string;
    duration: number;
    location: string;
    agenda: string;
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
  const { areas } = useAppSelector((state) => state.plant);
  const { users } = useAppSelector((state) => state.user);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [uploadingDrawing, setUploadingDrawing] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);

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
        },
        drawings: [{ name: '', url: '', type: 'PFD' }]
      },
      scheduledMeetings: [{ date: '', duration: 120, location: '', agenda: '' }]
    }
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'team'
  });

  const { fields: drawingFields, append: appendDrawing, remove: removeDrawing } = useFieldArray({
    control,
    name: 'process.drawings'
  });

  const { fields: meetingFields, append: appendMeeting, remove: removeMeeting } = useFieldArray({
    control,
    name: 'scheduledMeetings'
  });

  const watchPlantId = watch('plantId');

  useEffect(() => {
    if (watchPlantId) {
      const plant = plants.find(p => p._id === watchPlantId);
      setSelectedPlant(plant);
    }
  }, [watchPlantId, plants]);

  useEffect(() => {
      if (watchPlantId) {
        dispatch(getArea({ companyId: user?.companyId, plantId: watchPlantId }));
      }
    }, [dispatch, user?.companyId, watchPlantId]);

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
      setValue('chairman', currentStudy.chairman?._id || '');
      setValue('scribe', currentStudy.scribe?._id || '');
      setValue('process', currentStudy.process || {
        operatingConditions: {
          temperature: { unit: '°C' },
          pressure: { unit: 'bar' },
          flowRate: { unit: 'm³/h' }
        },
        drawings: [{ name: '', url: '', type: 'PFD' }]
      });
      setValue('team', currentStudy.team?.map((t: any) => ({
        member: t.member?._id || '',
        role: t.role || '',
        expertise: t.expertise || ''
      })) || []);
    }
  }, [currentStudy, isEdit, setValue]);

  const handleDrawingUpload = async (files: FileList, drawingIndex: number) => {
    if (!files.length) return;

    setUploadingDrawing(true);
    const formData = new FormData();
    formData.append('files', files[0]);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const url = response.data.urls[0];
      setValue(`process.drawings.${drawingIndex}.url`, url);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Drawing uploaded successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to upload drawing'
      }));
    } finally {
      setUploadingDrawing(false);
    }
  };

  const onSubmit = async (data: HAZOPFormData) => {
    if (!user?.companyId) return;

    // Validate team composition
    if (!data.chairman || !data.scribe) {
      dispatch(addNotification({
        type: 'error',
        message: 'Chairman and Scribe are required'
      }));
      return;
    }

    const teamMembers = data.team.filter(t => t.member);
    if (teamMembers.length === 0) {
      dispatch(addNotification({
        type: 'error',
        message: 'At least one team member is required'
      }));
      return;
    }

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
        const result = await dispatch(createHAZOPStudy({
          companyId: user.companyId,
          studyData: { ...data, sendNotifications }
        })).unwrap();
        
        if (sendNotifications) {
          dispatch(addNotification({
            type: 'success',
            message: 'HAZOP study created and team notified successfully'
          }));
        } else {
          dispatch(addNotification({
            type: 'success',
            message: 'HAZOP study created successfully'
          }));
        }
      }
      navigate('/hazop/studies');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save HAZOP study'
      }));
    }
  };

  // Get HAZOP configuration
  const hazopConfig = currentCompany?.config?.modules?.hazop;
  const chairmanRoles = hazopConfig?.teamRoles?.chairman || ['safety_incharge', 'plant_head'];
  const scribeRoles = hazopConfig?.teamRoles?.scribe || ['safety_incharge', 'hod'];
  const memberRoles = hazopConfig?.teamRoles?.members || ['hod', 'safety_incharge', 'contractor', 'worker'];

  const methodologies = [
    { value: 'HAZOP', label: 'HAZOP' },
    { value: 'WHAT-IF', label: 'What-If Analysis' },
    { value: 'CHECKLIST', label: 'Checklist Analysis' },
    { value: 'FMEA', label: 'FMEA' },
  ];

  const drawingTypes = [
    { value: 'PFD', label: 'Process Flow Diagram' },
    { value: 'PID', label: 'Piping & Instrumentation Diagram' },
    { value: 'LAYOUT', label: 'Layout Drawing' },
    { value: 'ISOMETRIC', label: 'Isometric Drawing' },
    { value: 'OTHER', label: 'Other' },
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
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Study Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.methodology.message}</p>
              )}
            </div>
          </div>

          <div className="mb-6">
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

          {/* Plant and Area Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.plantId.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="areaId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area
              </label>
              <select
                {...register('areaId')}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={!selectedPlant}
              >
                <option value="">Select Area</option>
                {areas?.map((area: any) => (
                  <option key={area._id} value={area._id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Process Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Process Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.process.name.message}</p>
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
          </div>

          {/* Operating Conditions */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
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

          {/* Process Drawings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Process Drawings
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => appendDrawing({ name: '', url: '', type: 'PFD' })}
              >
                Add Drawing
              </Button>
            </div>
            <div className="space-y-4">
              {drawingFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drawing Name
                    </label>
                    <input
                      {...register(`process.drawings.${index}.name` as const)}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Drawing name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type
                    </label>
                    <select
                      {...register(`process.drawings.${index}.type` as const)}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      {drawingTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Upload Drawing
                    </label>
                    <div className="mt-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-2 text-center">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        id={`drawing-${index}`}
                        onChange={(e) => e.target.files && handleDrawingUpload(e.target.files, index)}
                      />
                      <label htmlFor={`drawing-${index}`} className="cursor-pointer">
                        <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Upload</span>
                      </label>
                    </div>
                    {watch(`process.drawings.${index}.url`) && (
                      <div className="mt-2">
                        <img
                          src={watch(`process.drawings.${index}.url`)}
                          alt="Drawing preview"
                          className="w-full h-20 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeDrawing(index)}
                      disabled={drawingFields.length === 1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Study Team */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Study Team
          </h2>

          {/* Chairman and Scribe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="chairman" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chairman *
              </label>
              <select
                {...register('chairman', { required: 'Chairman is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Chairman</option>
                {users.filter(u => chairmanRoles.includes(u.role)).map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              {errors.chairman && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.chairman.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="scribe" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Scribe *
              </label>
              <select
                {...register('scribe', { required: 'Scribe is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Scribe</option>
                {users.filter(u => scribeRoles.includes(u.role)).map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              {errors.scribe && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.scribe.message}</p>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Team Members
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
                      {users.filter(u => memberRoles.includes(u.role)).map((user) => (
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
          </div>
        </Card>

        {/* Scheduled Meetings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scheduled Meetings
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => appendMeeting({ date: '', duration: 120, location: '', agenda: '' })}
            >
              Add Meeting
            </Button>
          </div>

          <div className="space-y-4">
            {meetingFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date & Time
                  </label>
                  <input
                    {...register(`scheduledMeetings.${index}.date` as const)}
                    type="datetime-local"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Duration (min)
                  </label>
                  <input
                    {...register(`scheduledMeetings.${index}.duration` as const, { valueAsNumber: true })}
                    type="number"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input
                    {...register(`scheduledMeetings.${index}.location` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Meeting location"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Agenda
                  </label>
                  <input
                    {...register(`scheduledMeetings.${index}.agenda` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Meeting agenda"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => removeMeeting(index)}
                    disabled={meetingFields.length === 1}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Notification Settings */}
        {!isEdit && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Notification Settings
            </h2>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sendNotifications"
                checked={sendNotifications}
                onChange={(e) => setSendNotifications(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sendNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                Send email notifications to team members about their assignment
              </label>
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default HAZOPForm;