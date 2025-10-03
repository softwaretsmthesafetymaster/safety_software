import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  Users,
  FileText,
  Calendar,
  Target,
  MapPin
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHIRAAssessment, updateHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface HIRAFormData {
  title: string;
  process: string;
  description: string;
  plantId: string;
  areaId: string;
  assessmentDate: string;
  reviewDate: string;
  team: string[];
}

const HIRAForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const isEdit = !!id;

  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { plants } = useAppSelector((state) => state.plant);
  const { users } = useAppSelector((state) => state.user);
  
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HIRAFormData>({
    defaultValues: {
      team: []
    }
  });

  const watchPlantId = watch('plantId');

  useEffect(() => {
    if (watchPlantId) {
      const plant = plants.find(p => p._id === watchPlantId);
      setSelectedPlant(plant);
      setValue('areaId', ''); // Reset area when plant changes
    }
  }, [watchPlantId, plants, setValue]);

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment && isEdit) {
      setValue('title', currentAssessment.title || '');
      setValue('process', currentAssessment.process || '');
      setValue('description', currentAssessment.description || '');
      setValue('plantId', currentAssessment.plantId?._id || '');
      setValue('areaId', currentAssessment.areaId || '');
      setValue('assessmentDate', currentAssessment.assessmentDate ? 
        new Date(currentAssessment.assessmentDate).toISOString().split('T')[0] : '');
      setValue('reviewDate', currentAssessment.reviewDate ? 
        new Date(currentAssessment.reviewDate).toISOString().split('T')[0] : '');
      
      const teamIds = currentAssessment.team?.map((t: any) => t._id) || [];
      setValue('team', teamIds);
      setSelectedTeam(teamIds);
    }
  }, [currentAssessment, isEdit, setValue]);

  const onSubmit = async (data: HIRAFormData) => {
    if (!user?.companyId) return;
    
    try {
      if (isEdit && id) {
        await dispatch(updateHIRAAssessment({
          companyId: user.companyId,
          id,
          data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'HIRA assessment updated successfully'
        }));
      } else {
        const result = await dispatch(createHIRAAssessment({
          companyId: user.companyId,
          assessmentData: data
        })).unwrap();
        
        dispatch(addNotification({
          type: 'success',
          message: 'HIRA assessment created successfully'
        }));
       
        // Redirect to assignment page if team is selected
        if (data.team.length > 0) {
          navigate(`/hira/assessments/${result.assessment._id}/assign`);
          return;
        }
      }
      
      navigate('/hira/assessments');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save HIRA assessment'
      }));
    }
  };

  const handleTeamSelection = (userId: string) => {
    const newTeam = selectedTeam.includes(userId)
      ? selectedTeam.filter(id => id !== userId)
      : [...selectedTeam, userId];
    
    setSelectedTeam(newTeam);
    setValue('team', newTeam);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit HIRA Assessment' : 'New HIRA Assessment'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update assessment details' : 'Create a new hazard identification and risk assessment'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate('/hira/assessments')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Update' : 'Create'} Assessment
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Assessment Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assessment Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter assessment title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Plant *
              </label>
              <select
                {...register('plantId', { required: 'Plant is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Area *
              </label>
              <select
                {...register('areaId', { required: 'Area is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                disabled={!selectedPlant}
              >
                <option value="">Select Area</option>
                {selectedPlant?.areas?.map((area: any) => (
                  <option key={area._id} value={area._id}>
                    {area.name} ({area.code})
                  </option>
                ))}
              </select>
              {errors.areaId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.areaId.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Process *
              </label>
              <input
                {...register('process', { required: 'Process is required' })}
                type="text"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter process name"
              />
              {errors.process && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.process.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter assessment description"
              />
            </div>
          </div>
        </Card>

        {/* Dates */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Assessment Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assessment Date *
              </label>
              <input
                {...register('assessmentDate', { required: 'Assessment date is required' })}
                type="date"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.assessmentDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assessmentDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review Date
              </label>
              <input
                {...register('reviewDate')}
                type="date"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </Card>

        {/* Team Assignment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Assignment
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Team Members
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
              {users.filter(u => u._id !== user?._id).map((teamUser) => (
                <label key={teamUser._id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedTeam.includes(teamUser._id)}
                    onChange={() => handleTeamSelection(teamUser._id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {teamUser.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {teamUser.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {teamUser.role}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Select team members who will participate in the HIRA assessment
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default HIRAForm;