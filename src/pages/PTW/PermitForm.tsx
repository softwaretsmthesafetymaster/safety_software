import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SignatureCanvas } from '../../components/DigitalSignature/SignatureCanvas';
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
  Shield,
  PenTool,
  CheckSquare,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createPermit, updatePermit, fetchPermitById, submitPermit } from '../../store/slices/permitSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import axios from 'axios';
import { getArea } from '../../store/slices/plantSlice';
const API_URL = import.meta.env.VITE_API_URL;
interface PermitFormData {
  types: string[];
  workDescription: string;
  location: {
    area: string;
    specificLocation: string;
  };
  plantId: string;
  areaId: string;
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
  signatures: Array<{
    role: string;
    signature: string;
  }>;
}

const PermitForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentPermit, isLoading } = useAppSelector((state) => state.permit);
  const { plants } = useAppSelector((state) => state.plant);
  const { areas } = useAppSelector((state) => state.plant);
  
  const { currentCompany } = useAppSelector((state) => state.company);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [signatureData, setSignatureData] = useState<string>('');
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string>('');
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
        { item: 'High Visibility Vest', required: true },
      ],
      safetyChecklist: [],
      signatures: [
        { role: 'Permit Holder', signature: '' },
        { role: 'Area In-charge', signature: '' },
      ]
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

  const watchPlantId = watch('plantId');
  const watchTypes = watch('types');

  const handleSignatureSave = async (signature: string) => {
 
    const signatureUrl = await uploadSignature(signature);
 
    setSignatureData(signatureUrl)

    setValue('signatures', [
      { role: 'Permit Holder', signature: signatureUrl },
    ]);
    setIsSignatureModalOpen(false);
    setSignatureImage(signatureUrl);
  };
  const uploadSignature = async (signature: string) => {
    try {
      const formData = new FormData();
      formData.append('files', signature);
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.urls[0];
    } catch (error) {
      console.error('Error uploading signature:', error);
      return null;
    }
  };
  const handleSignatureCancel = () => {
    setIsSignatureModalOpen(false);
  };
  
  useEffect(() => {
    if (watchPlantId) {
      const plant = plants.find(p => p._id === watchPlantId);
      setSelectedPlant(plant);
    }
  }, [watchPlantId, plants]);
  
  useEffect(() => {
    if (watchPlantId) {
      dispatch(getArea({ companyId: user.companyId, plantId: watchPlantId }));
    }
  }, [dispatch, user.companyId, watchPlantId]);

  useEffect(() => {
    if (watchTypes && watchTypes.length > 0) {
      setSelectedTypes(watchTypes);
      updateChecklistBasedOnTypes(watchTypes);
    }
  }, [watchTypes]);

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchPermitById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentPermit && isEdit) {
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
      setValue('areaId', currentPermit.areaId || '');
    }
  }, [currentPermit, isEdit, setValue]);

  const updateChecklistBasedOnTypes = (types: string[]) => {
    const ptwConfig = currentCompany?.config?.modules?.ptw;
    const checklists = ptwConfig?.checklists || {};
    
    let combinedChecklist: Array<{ item: string; checked: boolean; remarks: string }> = [];
    
    types.forEach(type => {
      const typeKey = type.replace('_', '');
      const typeChecklist = checklists[typeKey] || [];
      
      typeChecklist.forEach((item: string) => {
        if (!combinedChecklist.find(c => c.item === item)) {
          combinedChecklist.push({ item, checked: false, remarks: '' });
        }
      });
    });
    
    setValue('safetyChecklist', combinedChecklist);
  };

  const onSubmit = async (data: PermitFormData, isDraft = true) => {
    if (!user?.companyId) return;
    
    try {
      const permitData = {
        ...data,
        status: isDraft ? 'draft' : 'submitted'
      };

      if (isEdit && id) {
        await dispatch(updatePermit({
          companyId: user.companyId,
          id,
          data: permitData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Permit updated successfully'
        }));
      } else {
        const result = await dispatch(createPermit({
          companyId: user.companyId,
          permitData
        })).unwrap();
        
        if (!isDraft) {
          await dispatch(submitPermit({
            companyId: user.companyId,
            id: result._id
          })).unwrap();
        }
        
        dispatch(addNotification({
          type: 'success',
          message: isDraft ? 'Permit saved as draft' : 'Permit submitted for approval'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Permit' : 'New Work Permit'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update permit details' : 'Create a new work permit with safety requirements'}
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
            onClick={handleSubmit((data) => onSubmit(data, true))}
          >
            {isEdit ? 'Update' : 'Save Draft'}
          </Button>
          {!isEdit && (
            <Button
              variant="success"
              icon={Send}
              onClick={handleSubmit((data) => onSubmit(data, false))}
            >
              Submit for Approval
            </Button>
          )}
        </div>
      </div>

      <form className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Basic Information
          </h2>
          
          {/* Permit Types */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Permit Types *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {permitTypes.map((type) => (
                <label key={type.value} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
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
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.types.message}</p>
            )}
          </div>

          {/* Work Description */}
          <div className="mb-6">
            <label htmlFor="workDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Work Description *
            </label>
            <textarea
              {...register('workDescription', { required: 'Work description is required' })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Describe the work to be performed in detail..."
            />
            {errors.workDescription && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.workDescription.message}</p>
            )}
          </div>

          {/* Plant and Area Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                Area *
              </label>
              <select
                {...register('areaId', { required: 'Area is required' })}
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
              {errors.areaId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.areaId.message}</p>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="location.area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specific Area *
              </label>
              <input
                {...register('location.area', { required: 'Area is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Production Unit 1"
              />
              {errors.location?.area && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location.area.message}</p>
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
                Start Date & Time *
              </label>
              <input
                {...register('schedule.startDate', { required: 'Start date is required' })}
                type="datetime-local"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.schedule?.startDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.schedule.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="schedule.endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                End Date & Time *
              </label>
              <input
                {...register('schedule.endDate', { required: 'End date is required' })}
                type="datetime-local"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.schedule?.endDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.schedule.endDate.message}</p>
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
                <option value="day">Day Shift (6 AM - 6 PM)</option>
                <option value="night">Night Shift (6 PM - 6 AM)</option>
                <option value="24hour">24 Hour Operation</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Personnel Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Personnel Information
          </h2>

          {/* Contractor Details */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
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
                  placeholder="Enter contractor company name"
                />
                {errors.contractor?.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contractor.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contractor.contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contact Number *
                </label>
                <input
                  {...register('contractor.contact', { required: 'Contact number is required' })}
                  type="tel"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter contact number"
                />
                {errors.contractor?.contact && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contractor.contact.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="contractor.license" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  License Number
                </label>
                <input
                  {...register('contractor.license')}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter license number"
                />
              </div>
            </div>
          </div>

          {/* Workers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                Workers ({workerFields.length})
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
                      Worker Name *
                    </label>
                    <input
                      {...register(`workers.${index}.name` as const, { required: 'Name is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ID Number *
                    </label>
                    <input
                      {...register(`workers.${index}.id` as const, { required: 'ID is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Employee/Badge ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Number
                    </label>
                    <input
                      {...register(`workers.${index}.contact` as const)}
                      type="tel"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      {...register(`workers.${index}.medicalFitness` as const)}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Medical Fitness Certified
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
        </Card>

        {/* Safety Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Safety Information
          </h2>

          {/* Hazards */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
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
                      Hazard Type *
                    </label>
                    <select
                      {...register(`hazards.${index}.type` as const, { required: 'Hazard type is required' })}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Hazard</option>
                      <option value="fire">Fire/Explosion</option>
                      <option value="chemical">Chemical Exposure</option>
                      <option value="electrical">Electrical Shock</option>
                      <option value="fall">Fall from Height</option>
                      <option value="struck">Struck by Object</option>
                      <option value="caught">Caught in/between</option>
                      <option value="ergonomic">Ergonomic</option>
                      <option value="environmental">Environmental</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mitigation Measures *
                    </label>
                    <input
                      {...register(`hazards.${index}.mitigation` as const, { required: 'Mitigation is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Control measures to be implemented"
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
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
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
                        className="border-0 bg-transparent p-0 focus:ring-0 text-sm font-medium"
                        placeholder="PPE item"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Safety Checklist */}
        {watch('safetyChecklist')?.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckSquare className="h-5 w-5 mr-2" />
              Safety Checklist
            </h2>
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
                        readOnly
                      />
                      <textarea
                        {...register(`safetyChecklist.${index}.remarks` as const)}
                        rows={2}
                        className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                        placeholder="Remarks or additional notes (optional)"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Digital Signatures */}
        <Card className="p-6">
         <div className="flex items-center justify-between">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <PenTool className="h-5 w-5 mr-2" />
            Digital Signatures
          </h2>

        <Button
          variant="primary"
          icon={PenTool}
          onClick={() => setIsSignatureModalOpen(true)}
        >
          Sign
        </Button>
         </div>
        <SignatureCanvas
          isOpen={isSignatureModalOpen}
          onSave={handleSignatureSave}
          onCancel={handleSignatureCancel}
          signerName={user?.name || 'Unknown'}
          signerRole={user?.role || 'Unknown'}
          
        />
        {signatureImage && <img src={signatureImage} alt="Signature" />}
      </Card>
      </form>
    </div>
  );
};

export default PermitForm;