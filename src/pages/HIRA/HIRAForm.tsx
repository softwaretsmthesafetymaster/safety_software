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
  MapPin,
  Building2,
  UserCheck // New icon for Lead Assessor
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHIRAAssessment, updateHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import { getArea } from '../../store/slices/plantSlice';
// Updated interface to include leadAccessor
interface HIRAFormData {
  title: string;
  process: string;
  description: string;
  plantId: string;
  areaId: string;
  assessmentDate: string;
  reviewDate: string;
  team: string[];
  leadAccessor: string; // New required field
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
  const { areas } = useAppSelector((state) => state.plant);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);

  // Updated useForm to include leadAccessor in defaultValues
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<HIRAFormData>({
    defaultValues: {
      team: [],
      leadAccessor: ''
    }
  });

  const watchPlantId = watch('plantId');

  useEffect(() => {
    if (watchPlantId || user?.plantId?._id) {
      setSelectedPlant(user?.plantId?._id);
      setValue('areaId', '');
    }
  }, [watchPlantId, setValue, user]);

  useEffect(() => {
    if (user?.plantId?._id) {
      dispatch(fetchUsers({ plantId: user.plantId?._id,companyId:user.companyId }));
      dispatch(getArea({ plantId: user.plantId?._id,companyId:user.companyId }));
    }
  }, [dispatch, user?.plantId?._id]);

  useEffect(() => {
    if (isEdit && id && user) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user]);

  useEffect(() => {
    if (currentAssessment && isEdit) {
      setValue('title', currentAssessment.title || '');
      setValue('process', currentAssessment.process || '');
      setValue('description', currentAssessment.description || '');
      setValue('plantId', currentAssessment.plantId?._id || '');
      setValue('areaId', currentAssessment.areaId || '');
      // Set leadAccessor value
      setValue('leadAccessor', currentAssessment.leadAccessor?._id || ''); 
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
      // Ensure leadAccessor is included in the data for both create and update
      const dataToSend = { ...data, team: data.team };

      if (isEdit && id) {
        await dispatch(updateHIRAAssessment({
          companyId: user.companyId,
          id,
          data: dataToSend
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'HIRA assessment updated successfully'
        }));
      } else {
        const result = await dispatch(createHIRAAssessment({
          companyId: user.companyId,
          assessmentData: dataToSend
        })).unwrap();

        dispatch(addNotification({
          type: 'success',
          message: 'HIRA assessment created successfully'
        }));

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

  // Improved class for input/select fields
  const inputClass = "w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white py-2 px-3";
  const disabledInputClass = "w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-800 dark:text-white cursor-not-allowed focus:ring-0 focus:border-gray-300 py-2 px-3";
  const fieldWrapperClass = "mb-4"; // Class for added spacing/padding between fields

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="max-w-7xl mx-auto space-y-8 "> {/* Added padding to container */}
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit HIRA Assessment' : 'New HIRA Assessment'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Update assessment details' : 'Create a new hazard identification and risk assessment'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/hira/assessments')}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Save}
              loading={isLoading}
              onClick={handleSubmit(onSubmit)}
              className="w-full sm:w-auto"
            >
              {isEdit ? 'Update' : 'Create'} Assessment
            </Button>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8"> {/* Increased spacing between card sections */}
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Assessment Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6"> {/* Horizontal gap */}
                <div className="lg:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assessment Title *
                  </label>
                  <input
                    {...register('title', { required: 'Title is required' })}
                    type="text"
                    className={inputClass}
                    placeholder="Enter assessment title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                <div className={fieldWrapperClass}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Building2 className="h-4 w-4 inline mr-1" />
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
                </div>

                <div className={fieldWrapperClass}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Area *
                  </label>
                  <select
                    {...register('areaId', { required: 'Area is required' })}
                    className={inputClass}
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

                <div className="lg:col-span-2 mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Process *
                  </label>
                  <input
                    {...register('process', { required: 'Process is required' })}
                    type="text"
                    className={inputClass}
                    placeholder="Enter process name"
                  />
                  {errors.process && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.process.message}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Enter assessment description"
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Dates and Lead Assessor */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Schedule & Lead
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={fieldWrapperClass}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assessment Date *
                  </label>
                  <input
                    {...register('assessmentDate', { required: 'Assessment date is required' })}
                    type="date"
                    className={inputClass}
                  />
                  {errors.assessmentDate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.assessmentDate.message}</p>
                  )}
                </div>

                <div className={fieldWrapperClass}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Review Date
                  </label>
                  <input
                    {...register('reviewDate')}
                    type="date"
                    className={inputClass}
                  />
                </div>
                
                {/* NEW FIELD: Lead Assessor */}
                <div className={fieldWrapperClass}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <UserCheck className="h-4 w-4 inline mr-1" />
                    Lead Assessor *
                  </label>
                  <select
                    {...register('leadAccessor', { required: 'Lead Assessor is required' })}
                    className={inputClass}
                  >
                    <option value="">Select Assessor</option>
                    {users?.map((leadUser: any) => (
                      <option key={leadUser._id} value={leadUser._id}>
                        {leadUser.name} ({leadUser.role})
                      </option>
                    ))}
                  </select>
                  {errors.leadAccessor && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.leadAccessor.message}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Team Assignment */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Assignment
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Select Team Members
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                  {users.filter(u => u._id !== user?._id).map((teamUser) => (
                    <motion.label
                      key={teamUser._id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-white dark:hover:bg-gray-700 p-3 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeam.includes(teamUser._id)}
                        onChange={() => handleTeamSelection(teamUser._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {teamUser.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {teamUser.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {teamUser.role}
                          </p>
                        </div>
                      </div>
                    </motion.label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Selected: {selectedTeam.length} team member{selectedTeam.length !== 1 ? 's' : ''}.
                  Team members will receive notifications and can collaborate on the assessment.
                </p>
              </div>
            </Card>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default HIRAForm;