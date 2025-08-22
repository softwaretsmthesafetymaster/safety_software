import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Target,
  Users,
  FileText
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createHIRAAssessment, updateHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface HIRAFormData {
  title: string;
  area: string;
  process: string;
  plantId: string;
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

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<HIRAFormData>({
    defaultValues: {
      team: []
    }
  });

  useEffect(() => {
    if (isEdit && id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, isEdit, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment && isEdit) {
      setValue('title', currentAssessment.title || '');
      setValue('area', currentAssessment.area || '');
      setValue('process', currentAssessment.process || '');
      setValue('plantId', currentAssessment.plantId?._id || '');
      setValue('assessmentDate', currentAssessment.assessmentDate ? new Date(currentAssessment.assessmentDate).toISOString().split('T')[0] : '');
      setValue('reviewDate', currentAssessment.reviewDate ? new Date(currentAssessment.reviewDate).toISOString().split('T')[0] : '');
      setValue('team', currentAssessment.team?.map((t: any) => t._id) || []);
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
        await dispatch(createHIRAAssessment({
          companyId: user.companyId,
          assessmentData: data
        })).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'HIRA assessment created successfully'
        }));
      }
      navigate('/hira/assessments');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save HIRA assessment'
      }));
    }
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
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Assessment Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assessment Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter assessment title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.title.message}
                </p>
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
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.plantId.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Area *
              </label>
              <input
                {...register('area', { required: 'Area is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter area name"
              />
              {errors.area && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.area.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="process" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Process *
              </label>
              <input
                {...register('process', { required: 'Process is required' })}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter process name"
              />
              {errors.process && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.process.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="assessmentDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assessment Date *
              </label>
              <input
                {...register('assessmentDate', { required: 'Assessment date is required' })}
                type="date"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.assessmentDate && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.assessmentDate.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reviewDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Review Date
              </label>
              <input
                {...register('reviewDate')}
                type="date"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Assessment Team
            </label>
            <select
              {...register('team')}
              multiple
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              size={5}
            >
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Hold Ctrl/Cmd to select multiple team members
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default HIRAForm;