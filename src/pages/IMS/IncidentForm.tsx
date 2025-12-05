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
  FileText,
  User,
  Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createIncident, updateIncident, fetchIncidentById } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import BodyMapSelector from '../../components/BodyMapSelector';
import { getArea } from '../../store/slices/plantSlice';
interface IncidentFormData {
  type: string;
  severity: string;
  classification?: string;
  dateTime: string;
  location: {
    area: string;
    specificLocation: string;
  };
  plantId: string;
  areaId: string;
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
  bodyPart: string[];
  bodyMap: {
    injuries: Array<{
      bodyPart: string;
      injuryType: string;
      severity: string;
      coordinates: { x: number; y: number };
    }>;
  };
}

const IncidentForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);
  const { plants } = useAppSelector((state) => state.plant);
  const { areas } = useAppSelector((state) => state.plant);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [bodyMapInjuries, setBodyMapInjuries] = useState<any[]>([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<IncidentFormData>({
    defaultValues: {
      affectedPersons: [{ name: '', role: '', injuryDetails: '', bodyPart: '', medicalAttention: false }],
      witnesses: [{ name: '', contact: '', statement: '' }],
      bodyMap: { injuries: [] } ,
      bodyPart: []
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
  const watchPlantId = watch('plantId');

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
      setValue('areaId', currentIncident.areaId || '');
      
      if (currentIncident.bodyMap?.injuries) {
        setBodyMapInjuries(currentIncident.bodyMap.injuries);
      }
      if (currentIncident.bodyPart) {
        setSelectedBodyParts(currentIncident.bodyPart);
      }
    }
  }, [currentIncident, isEdit, setValue]);

  const onSubmit = async (data: IncidentFormData) => {
    if (!user?.companyId) return;

    const incidentData = {
      ...data,
      bodyMap: { injuries: bodyMapInjuries },
      bodyPart: selectedBodyParts
    };

    try {
      if (isEdit && id) {
        await dispatch(updateIncident({
          companyId: user.companyId,
          id,
          updateData: incidentData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Incident updated successfully'
        }));
      } else {
        await dispatch(createIncident({
          companyId: user.companyId,
          incidentData
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
    { value: 'injury', label: 'Personal Injury', icon: User, color: 'text-red-500' },
    { value: 'near_miss', label: 'Near Miss', icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'property_damage', label: 'Property Damage', icon: FileText, color: 'text-orange-500' },
    { value: 'environmental', label: 'Environmental', icon: MapPin, color: 'text-green-500' },
    { value: 'security', label: 'Security', icon: Users, color: 'text-purple-500' },
  ];

  const severityLevels = [
    { value: 'low', label: 'Low', color: 'text-green-600', description: 'Minor impact, no injury' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600', description: 'Moderate impact, first aid' },
    { value: 'high', label: 'High', color: 'text-orange-600', description: 'Significant impact, medical treatment' },
    { value: 'critical', label: 'Critical', color: 'text-red-600', description: 'Severe impact, lost time/fatality' },
  ];

  const classificationOptions = [
    { value: 'first_aid', label: 'First Aid Case' },
    { value: 'medical_treatment', label: 'Medical Treatment Case' },
    { value: 'lost_time', label: 'Lost Time Injury' },
    { value: 'fatality', label: 'Fatality' },
  ];

  const bodyParts = [
    'Head', 'Eyes', 'Face', 'Neck', 'Shoulder', 'Arm', 'Elbow', 'Wrist', 'Hand', 'Fingers',
    'Chest', 'Back', 'Abdomen', 'Hip', 'Thigh', 'Knee', 'Leg', 'Ankle', 'Foot', 'Toes'
  ];

  const handleBodyMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    
    const bodyPart = prompt('Select body part:', bodyParts.join(', '));
    const injuryType = prompt('Injury type:', 'Cut, Bruise, Burn, Fracture, Sprain, etc.');
    const severity = prompt('Injury severity:', 'Minor, Moderate, Severe');
    
    if (bodyPart && injuryType && severity) {
      const newInjury = {
        bodyPart,
        injuryType,
        severity,
        coordinates: { x, y }
      };
      setBodyMapInjuries(prev => [...prev, newInjury]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Incident' : 'Report Safety Incident'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update incident details' : 'Report a new safety incident with complete details'}
          </p>
        </div>
        
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}> 
        {/* Incident Classification */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Incident Classification
          </h2>

          {/* Incident Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Incident Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {incidentTypes.map((type) => (
                <label key={type.value} className="relative">
                  <input
                    {...register('type', { required: 'Incident type is required' })}
                    type="radio"
                    value={type.value}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    watchType === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <type.icon className={`h-8 w-8 mx-auto mb-2 ${type.color}`} />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.type.message}</p>
            )}
          </div>

          {/* Severity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Severity Level *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {severityLevels.map((level) => (
                <label key={level.value} className="relative">
                  <input
                    {...register('severity', { required: 'Severity level is required' })}
                    type="radio"
                    value={level.value}
                    className="sr-only"
                  />
                  <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    watch('severity') === level.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}>
                    <div className="text-center">
                      <span className={`text-lg font-bold ${level.color}`}>
                        {level.label}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.severity && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.severity.message}</p>
            )}
          </div>

          {/* Classification (for injury incidents) */}
          {watchType === 'injury' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Injury Classification *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {classificationOptions.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      {...register('classification', { required: watchType === 'injury' ? 'Classification is required for injuries' : false })}
                      type="radio"
                      value={option.value}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.classification && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.classification.message}</p>
              )}
            </div>
          )}
        </Card>

        {/* Incident Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Incident Details
          </h2>

          {/* Date and Time */}
          <div className="mb-6">
            <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Date and Time of Incident *
            </label>
            <div className="mt-1 relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                {...register('dateTime', { required: 'Date and time is required' })}
                type="datetime-local"
                className="pl-10 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            {errors.dateTime && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dateTime.message}</p>
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

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="location.area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Specific Area *
              </label>
              <input
                {...register('location.area', { required: 'Area is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="e.g., Production Unit 1, Reactor Area"
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
                placeholder="e.g., Near Reactor R-101, Pump P-205"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Incident Description *
            </label>
            <textarea
              {...register('description', { required: 'Description is required', minLength: { value: 2, message: 'Description must be at least 2 characters' } })}
              rows={5}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Describe what happened in detail. Include sequence of events, conditions at the time, and any contributing factors..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
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
              placeholder="Describe immediate actions taken after the incident (first aid, area isolation, emergency response, etc.)"
            />
          </div>
        </Card>

        {/* Body Map (for injury incidents) */}
        {watchType === 'injury' && (
         <Card className="p-6">
         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
           <User className="h-5 w-5 mr-2" />
           Body Map - Select Injuries
         </h2>
   
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Body Map Selector */}
           <BodyMapSelector
             selectedBodyParts={selectedBodyParts}
             onBodyPartsChange={setSelectedBodyParts}
           />
   
           {/* Recorded Injuries */}
           <div>
             <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
               Recorded Injuries ({selectedBodyParts.length})
             </h3>
             <div className="space-y-2 max-h-80 overflow-y-auto">
               {selectedBodyParts.length === 0 ? (
                 <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                   No injuries selected. Use the diagram or dropdown to mark injuries.
                 </p>
               ) : (
                 selectedBodyParts.map((part, index) => (
                   <div
                     key={index}
                     className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                   >
                     <div className="flex items-center justify-between">
                       <p className="font-medium text-gray-900 dark:text-white">{part}</p>
                       <button
                         type="button"
                         className="text-red-600 hover:text-red-800 text-sm font-medium"
                         onClick={() =>
                           setSelectedBodyParts((prev) =>
                             prev.filter((p) => p !== part)
                           )
                         }
                       >
                         Remove
                       </button>
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
         </div>
       </Card>
        )}

        {/* People Involved */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            People Involved
          </h2>

          {/* Affected Persons */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
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
                      Name *
                    </label>
                    <input
                      {...register(`affectedPersons.${index}.name` as const, { required: 'Name is required' })}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role/Position
                    </label>
                    <input
                      {...register(`affectedPersons.${index}.role` as const)}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Job title"
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
                      placeholder="Nature of injury"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Body Part
                    </label>
                    <select
                      {...register(`affectedPersons.${index}.bodyPart` as const)}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Body Part</option>
                      {bodyParts.map(part => (
                        <option key={part} value={part}>{part}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center pt-6">
                    <input
                      {...register(`affectedPersons.${index}.medicalAttention` as const)}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Medical Attention Required
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
              <h3 className="text-md font-medium text-gray-900 dark:text-white">
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
                      Witness Name
                    </label>
                    <input
                      {...register(`witnesses.${index}.name` as const)}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Information
                    </label>
                    <input
                      {...register(`witnesses.${index}.contact` as const)}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Phone/email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Witness Statement
                    </label>
                    <textarea
                      {...register(`witnesses.${index}.statement` as const)}
                      rows={2}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="What did they witness?"
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
        </Card>

        {/* Photo Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Photos & Evidence
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
                PNG, JPG, PDF up to 10MB each. Include photos of the incident scene, equipment involved, and any relevant documents.
              </p>
            </div>
          </div>
        </Card>
        <div className="flex items-end space-x-3">
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
            type='submit'
          >
            {isEdit ? 'Update Incident' : 'Report Incident'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default IncidentForm;