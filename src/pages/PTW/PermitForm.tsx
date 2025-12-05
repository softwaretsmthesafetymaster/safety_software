import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SignatureCanvas } from '../../components/DigitalSignature/SignatureCanvas';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'react-hot-toast';
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
import { 
  createPermit, 
  updatePermit, 
  fetchPermitById, 
  submitPermit,
  fetchPermitChecklist,
  updateChecklistsForPermit
} from '../../store/slices/permitSlice';
import { getArea } from '../../store/slices/plantSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import axios from 'axios';

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
    category: string;
  }>;
  signatures: Array<{
    user: Object;
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
  const { currentPermit, isLoading, checklists } = useAppSelector((state) => state.permit);
  const { plants, areas } = useAppSelector((state) => state.plant);
  
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
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
        { user: null,  role: 'Permit Holder', signature: '' },
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
    setSignatureData(signatureUrl);
    setSignatureImage(signatureUrl)
    setValue('signatures', [
      { user: user?._id, role: 'Permit Holder', signature: signatureUrl },
    ]);
    setIsSignatureModalOpen(false);
    toast.success('Signature saved successfully');
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
      toast.error('Failed to upload signature');
      return signature; // Return original if upload fails
    }
  };

  const handleSignatureCancel = () => {
    setIsSignatureModalOpen(false);
  };
  
  useEffect(() => {
    if (watchPlantId) {
      const plant = plants.find(p => p._id === watchPlantId);
      setSelectedPlant(plant);
      if (user?.companyId) {
        dispatch(getArea({ companyId: user.companyId, plantId: watchPlantId }));
      }
    }
  }, [watchPlantId, plants, dispatch, user?.companyId]);

  useEffect(() => {
    if (watchTypes && watchTypes.length > 0) {
      setSelectedTypes(watchTypes);
      loadChecklistsForTypes(watchTypes);
    }
  }, [watchTypes, dispatch]);

  const loadChecklistsForTypes = async (types: string[]) => {
    try {
      const checklistPromises = types.map(type => {
        // Map frontend permit types to backend permit types
        const mappedType = mapPermitType(type);
        return dispatch(fetchPermitChecklist(mappedType));
      });
      
      await Promise.all(checklistPromises);
      
      // After fetching all checklists, update the current permit
      dispatch(updateChecklistsForPermit({ 
        permitTypes: types.map(mapPermitType), 
        checklists 
      }));
      
      updateSafetyChecklistFromTypes(types);
    } catch (error) {
      console.error('Error loading checklists:', error);
      toast.error('Failed to load safety checklists');
    }
  };

  const mapPermitType = (frontendType: string) => {
    const mapping: { [key: string]: string } = {
      'hot_work': 'hotWork',
      'cold_work': 'coldWork',
      'electrical': 'electrical',
      'working_at_height': 'workAtHeight',
      'confined_space': 'confinedSpace',
      'excavation': 'excavation',
      'lifting': 'lifting',
      'fire': 'fire',
      'environmental': 'environmental',
      'demolition': 'demolition',
      'chemical': 'chemical',
      'radiation': 'radiation'
    };
    return mapping[frontendType] || frontendType;
  };

  const updateSafetyChecklistFromTypes = (types: string[]) => {
    const combinedChecklist: Array<{ item: string; checked: boolean; remarks: string; category: string }> = [];
    
    types.forEach(type => {
      const mappedType = mapPermitType(type);
      const typeChecklist = checklists[mappedType];
      
      if (typeChecklist) {
        // Add risk associated items
        typeChecklist.riskAssociated?.forEach((item: string) => {
          if (!combinedChecklist.find(c => c.item === item)) {
            combinedChecklist.push({ 
              item, 
              checked: false, 
              remarks: '', 
              category: 'risk' 
            });
          }
        });

        // Add precautions
        typeChecklist.precautions?.forEach((item: string) => {
          if (!combinedChecklist.find(c => c.item === item)) {
            combinedChecklist.push({ 
              item, 
              checked: false, 
              remarks: '', 
              category: 'precaution' 
            });
          }
        });

        // Add PPE items to main PPE list
        typeChecklist.ppeRequired?.forEach((item: string) => {
          const currentPPE = watch('ppe') || [];
          if (!currentPPE.find(p => p.item === item)) {
            setValue('ppe', [...currentPPE, { item, required: true }]);
          }
        });

        // Add inspection checklist
        typeChecklist.inspectionChecklist?.forEach((item: string) => {
          if (!combinedChecklist.find(c => c.item === item)) {
            combinedChecklist.push({ 
              item, 
              checked: false, 
              remarks: '', 
              category: 'inspection' 
            });
          }
        });

        // Add rescue techniques
        typeChecklist.rescueTechniques?.forEach((item: string) => {
          if (!combinedChecklist.find(c => c.item === item)) {
            combinedChecklist.push({ 
              item, 
              checked: false, 
              remarks: '', 
              category: 'rescue' 
            });
          }
        });
      }
    });
    
    setValue('safetyChecklist', combinedChecklist);
  };

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
        startDate: currentPermit.schedule?.startDate ? new Date(currentPermit.schedule.startDate).toISOString().slice(0, 16) : '',
        endDate: currentPermit.schedule?.endDate ? new Date(currentPermit.schedule.endDate).toISOString().slice(0, 16) : '',
        shift: currentPermit.schedule?.shift || ''
      });
      setValue('plantId', currentPermit.plantId?._id || '');
      setValue('areaId', currentPermit.areaId || '');
      setValue('workers', currentPermit.workers || []);
      setValue('hazards', currentPermit.hazards || []);
      setValue('ppe', currentPermit.ppe || []);
      setValue('safetyChecklist', currentPermit.safetyChecklist || []);
      
      if (currentPermit.signatures && currentPermit.signatures.length > 0) {
        setSignatureImage(currentPermit.signatures[0].signature);
      }
    }
  }, [currentPermit, isEdit, setValue]);

  const onSubmit = async (data: PermitFormData, isDraft = true) => {
    if (!user?.companyId) {
      toast.error('User company information is missing');
      return;
    }
    
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
        toast.success('Permit updated successfully');
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
        
        toast.success(isDraft ? 'Permit saved as draft' : 'Permit submitted for approval');
      }
      navigate('/ptw/permits');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save permit');
    }
  };

  const permitTypes = [
    { value: 'hot_work', label: 'Hot Work' },
    { value: 'cold_work', label: 'Cold Work' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'working_at_height', label: 'Working at Height' },
    { value: 'confined_space', label: 'Confined Space' },
    { value: 'excavation', label: 'Excavation' },
    { value: 'lifting', label: 'Lifting Operations' },
    { value: 'fire', label: 'Fire Work' },
    { value: 'environmental', label: 'Environmental' },
    { value: 'demolition', label: 'Demolition' },
    { value: 'chemical', label: 'Chemical Work' },
    { value: 'radiation', label: 'Radiation Work' },
  ];
  const disabledInputClass = "w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-800 dark:text-white cursor-not-allowed focus:ring-0 focus:border-gray-300 py-2 px-3";
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
              loading={isLoading}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {permitTypes.map((type) => (
                <label key={type.value} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
              <input
                    type="text"
                    value={user?.plantId?.name ? `${user.plantId.name} (${user.plantId.code})` : ''}
                    readOnly
                    className={disabledInputClass}
                  />
              <input
                    {...register('plantId')}
                    type="hidden"
                    value={user?.plantId?._id || ''}
                  />
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
                        className="border-0 bg-transparent p-0 focus:ring-0 text-sm font-medium dark:text-white"
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
      {watch('safetyChecklist')?.map((item, index) => {
        const checked = watch(`safetyChecklist.${index}.checked`);
        return (
          <div 
            key={index} 
            className={`p-4 border rounded-lg transition 
              ${checked ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}
          >
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                {...register(`safetyChecklist.${index}.checked` as const)}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />

              <p className="text-sm text-gray-900 dark:text-gray-300 font-medium">
                {item.item}
              </p>
            </label>

            {checked && (
              <textarea
                {...register(`safetyChecklist.${index}.remarks` as const)}
                rows={2}
                className="mt-3 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-green-500 focus:ring-green-500 dark:bg-gray-800 dark:text-white text-sm"
                placeholder="Add remarks (optional)"
              />
            )}
          </div>
        );
      })}
    </div>
  </Card>
)}


        {/* Digital Signatures */}
        <Card className="p-6">
         <div className="flex items-center justify-between mb-4">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <PenTool className="h-5 w-5 mr-2" />
            Digital Signatures
          </h2>

        <Button
          type="button"
          variant="primary"
          icon={PenTool}
          onClick={() => setIsSignatureModalOpen(true)}
        >
          {signatureImage ? 'Update Signature' : 'Sign'}
        </Button>
         </div>
         
        <SignatureCanvas
          isOpen={isSignatureModalOpen}
          onSave={handleSignatureSave}
          onCancel={handleSignatureCancel}
          signerName={user?.name || 'Unknown'}
          signerRole={user?.role || 'Unknown'}
        />
        
        {signatureImage && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Signature:</p>
            <img 
              src={signatureImage} 
              alt="Digital Signature" 
              className="max-h-20 border border-gray-300 dark:border-gray-600 rounded"
            />
          </div>
        )}
      </Card>
      </form>
    </div>
  );
};

export default PermitForm;