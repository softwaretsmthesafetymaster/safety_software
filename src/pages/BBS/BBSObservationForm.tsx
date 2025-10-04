import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle,
  Camera,
  Bot,
  Lightbulb,
  MapPin
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createBBSReport, updateBBSReport, fetchBBSById } from '../../store/slices/bbsSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { bbsService } from '../../services/bbs/bbsService';
import { aiService } from '../../services/bbs/aiService';
import { getArea } from '../../store/slices/plantSlice';

interface BBSFormData {
  observationDate: string;
  location: {
    area: string;
    specificLocation: string;
  };
  plantId: string;
  areaId: string;
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
  feedback: {
    given: boolean;
    method: string;
    response: string;
  };
  photos: string[];
}

const BBSObservationForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;

  const { user } = useAppSelector((state) => state.auth);
  const { currentReport, isLoading } = useAppSelector((state) => state.bbs);
  const { plants } = useAppSelector((state) => state.plant);
  const { areas } = useAppSelector((state) => state.plant);
  const { currentCompany } = useAppSelector((state) => state.company);
  
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showAIHelper, setShowAIHelper] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<BBSFormData>({
    defaultValues: {
      observedPersons: [{ name: '', designation: '', department: '' }],
      feedback: { given: false, method: '', response: '' },
      photos: [],
      observationDate: new Date().toISOString().slice(0, 16)
    }
  });

  const { fields: personFields, append: appendPerson, remove: removePerson } = useFieldArray({
    control,
    name: 'observedPersons'
  });

  const watchObservationType = watch('observationType');
  const watchPlantId = watch('plantId');
  const watchFeedbackGiven = watch('feedback.given');
  const watchDescription = watch('description');

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
      dispatch(fetchBBSById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentReport && isEdit) {
      setValue('observationDate', currentReport.observationDate ? new Date(currentReport.observationDate).toISOString().slice(0, 16) : '');
      setValue('location', currentReport.location || { area: '', specificLocation: '' });
      setValue('plantId', currentReport.plantId?._id || '');
      setValue('areaId', currentReport.areaId || '');
      setValue('observationType', currentReport.observationType || '');
      setValue('category', currentReport.category || '');
      setValue('description', currentReport.description || '');
      setValue('severity', currentReport.severity || '');
      setValue('immediateAction', currentReport.immediateAction || '');
      setValue('rootCause', currentReport.rootCause || '');
      setValue('feedback', currentReport.feedback || { given: false, method: '', response: '' });
      setValue('observedPersons', currentReport.observedPersons || [{ name: '', designation: '', department: '' }]);
      setUploadedPhotos(currentReport.photos?.map((p: any) => p.url) || []);
    }
  }, [currentReport, isEdit, setValue]);

  useEffect(() => {
    if (watchDescription && watchObservationType) {
      generateAISuggestions();
    }
  }, [watchDescription, watchObservationType]);

  const generateAISuggestions = async () => {
    try {
      const tempObservation = {
        observationType: watchObservationType,
        description: watchDescription,
        severity: 'medium'
      };
      
      const assessment = await aiService.analyzeRisk(tempObservation);
      setAiSuggestions(assessment);
      setShowAIHelper(true);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    try {
      const urls = await bbsService.uploadFiles(files);
      setUploadedPhotos(prev => [...prev, ...urls]);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Photos uploaded successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to upload photos'
      }));
    }
  };

  const onSubmit = async (data: BBSFormData) => {
    if (!user?.companyId) return;

    try {
      const reportData = {
        ...data,
        photos: uploadedPhotos.map(url => ({ url, description: 'Observation evidence' }))
      };

      if (isEdit && id) {
        await dispatch(updateBBSReport({
          companyId: user.companyId,
          id,
          data: reportData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'BBS observation updated successfully'
        }));
      } else {
        await dispatch(createBBSReport({
          companyId: user.companyId,
          reportData
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'BBS observation reported successfully'
        }));
      }
      navigate('/bbs/observations');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save observation'
      }));
    }
  };

  const bbsConfig = currentCompany?.config?.bbs;
  const categories = bbsConfig?.categories || {
    unsafeActs: [
      'PPE not used',
      'Wrong procedure',
      'Unsafe position',
      'Operating without authority',
      'Operating at unsafe speed',
      'Making safety devices inoperative'
    ],
    unsafeConditions: [
      'Defective equipment',
      'Inadequate guards/barriers',
      'Defective PPE',
      'Poor housekeeping',
      'Hazardous environmental conditions',
      'Inadequate warning systems'
    ],
    safeBehaviors: [
      'Proper PPE usage',
      'Following procedures',
      'Good housekeeping',
      'Safety awareness',
      'Proactive safety behavior',
      'Helping others with safety'
    ]
  };

  const observationTypes = [
    { value: 'unsafe_act', label: 'Unsafe Act', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'unsafe_condition', label: 'Unsafe Condition', icon: AlertTriangle, color: 'text-orange-500' },
    { value: 'safe_behavior', label: 'Safe Behavior', icon: CheckCircle, color: 'text-green-500' },
  ];

  const getCategories = () => {
    switch (watchObservationType) {
      case 'unsafe_act':
        return categories.unsafeActs;
      case 'unsafe_condition':
        return categories.unsafeConditions;
      case 'safe_behavior':
        return categories.safeBehaviors;
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
            {isEdit ? 'Edit BBS Observation' : 'BBS Observation Report'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update observation details' : 'Report behavioral safety observations'}
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
            {isEdit ? 'Update' : 'Save'} Observation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Observation Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label htmlFor="observationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observation Date & Time *
                  </label>
                  <input
                    {...register('observationDate', { required: 'Date and time is required' })}
                    type="datetime-local"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                  {errors.observationDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observationDate.message}</p>
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
                    placeholder="Specific location details"
                  />
                </div>
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
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.severity.message}</p>
                )}
              </div>
            </Card>

            {/* Observation Type */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Observation Type & Category
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
              {errors.observationType && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observationType.message}</p>
              )}

              {watchObservationType && (
                <div className="mb-6">
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
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                  )}
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Detailed Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={5}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe what you observed in detail. Include the specific behavior, conditions, and context..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              </div>
            </Card>

            {/* Observed Persons */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
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
                        placeholder="Full name"
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
                        placeholder="Job title"
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
                        placeholder="Department"
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

            {/* Feedback */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Feedback Given
              </h2>
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

                {watchFeedbackGiven && (
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
                )}
              </div>
            </Card>

            {/* Photo Upload */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Photos/Evidence
              </h2>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Upload photos or documents
                    </span>
                    <input 
                      id="file-upload" 
                      type="file" 
                      className="sr-only" 
                      multiple 
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, PDF up to 10MB each
                  </p>
                </div>
              </div>
              
              {uploadedPhotos.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uploaded Files ({uploadedPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </form>
        </div>

        {/* AI Assistant Sidebar */}
        <div className="space-y-6">
          {/* AI Helper */}
          {showAIHelper && aiSuggestions && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <div className="flex items-center mb-4">
                <Bot className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Assistant
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Level</h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    aiSuggestions.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                    aiSuggestions.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    aiSuggestions.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {aiSuggestions.riskLevel.toUpperCase()}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1" />
                    Recommendations
                  </h4>
                  <ul className="text-sm space-y-1">
                    {aiSuggestions.recommendations.slice(0, 3).map((rec: string, index: number) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400 flex items-start">
                        <span className="flex-shrink-0 h-1.5 w-1.5 bg-purple-600 rounded-full mt-2 mr-2"></span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Quick Tips */}
          {/* <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              Quick Tips
            </h3>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Observation Quality
                </h4>
                <p className="text-blue-700 dark:text-blue-300">
                  Focus on specific behaviors and conditions, not personality traits
                </p>
              </div>
              
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">
                  Feedback Approach
                </h4>
                <p className="text-green-700 dark:text-green-300">
                  Start with positive reinforcement before addressing improvements
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                  Documentation
                </h4>
                <p className="text-orange-700 dark:text-orange-300">
                  Include photos and specific details for better follow-up
                </p>
              </div>
            </div>
          </Card> */}

          {/* Recent Activity */}
          {/* <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Recent Activity
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Completed safety training (2 days ago)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Submitted 3 observations this week
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Most active in Production Floor
                </span>
              </div>
            </div>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default BBSObservationForm;