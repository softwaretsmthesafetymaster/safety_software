import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  CheckCircle,
  FileText,
  Download
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHAZOPById, closeHAZOPStudy } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import { useExport } from '../../hooks/useExport';

interface ClosureData {
  closureComments: string;
  studyCompleteness: boolean;
  allRecommendationsAssigned: boolean;
  reportGenerated: boolean;
}

const HAZOPClosure: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading } = useAppSelector((state) => state.hazop);
  const { exportItem, isExporting } = useExport();

  const { register, handleSubmit, formState: { errors } } = useForm<ClosureData>();

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ClosureData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(closeHAZOPStudy({
        companyId: user.companyId,
        studyId: id,
        closureData: data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'HAZOP study closed successfully'
      }));
      navigate('/hazop/studies');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to close study'
      }));
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'word') => {
    if (!currentStudy) return;
    
    try {
      await exportItem(currentStudy, 'hazop', format);
      dispatch(addNotification({
        type: 'success',
        message: `HAZOP study exported as ${format.toUpperCase()} successfully`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to export HAZOP study'
      }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentStudy) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          HAZOP study not found
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Close HAZOP Study
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStudy.studyNumber} - {currentStudy.title}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('pdf')}
              loading={isExporting}
            >
              PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('excel')}
              loading={isExporting}
            >
              Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport('word')}
              loading={isExporting}
            >
              Word
            </Button>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/hazop/studies/${id}`)}
          >
            Back to Study
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Close Study
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Study Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Study Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Nodes
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentStudy.nodes?.length || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Worksheets
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentStudy.nodes?.reduce((total, node) => total + (node.worksheets?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  High Risk Items
                </label>
                <p className="text-lg font-semibold text-red-600">
                  {currentStudy.nodes?.reduce((total, node) => 
                    total + (node.worksheets?.filter(ws => ws.risk === 'high' || ws.risk === 'very_high').length || 0), 0
                  ) || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total Recommendations
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentStudy.nodes?.reduce((total, node) => 
                    total + (node.worksheets?.reduce((wsTotal, ws) => wsTotal + (ws.recommendations?.length || 0), 0) || 0), 0
                  ) || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Closure Checklist */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Closure Checklist
          </h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                {...register('studyCompleteness', { required: 'Study completeness confirmation is required' })}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  All nodes and worksheets have been completed
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Confirm that all planned nodes have been analyzed and worksheets completed
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                {...register('allRecommendationsAssigned', { required: 'Recommendations assignment confirmation is required' })}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  All recommendations have been assigned with target dates
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Confirm that responsible persons and target dates are assigned for all recommendations
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                {...register('reportGenerated')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Final study report has been generated and reviewed
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Study report has been generated and reviewed by the team
                </p>
              </div>
            </label>
          </div>

          {(errors.studyCompleteness || errors.allRecommendationsAssigned) && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">
              Please complete all required checklist items before closing the study
            </p>
          )}
        </Card>

        {/* Closure Comments */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Closure Comments
          </h2>
          
          <div>
            <label htmlFor="closureComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Study Closure Comments *
            </label>
            <textarea
              {...register('closureComments', { required: 'Closure comments are required' })}
              rows={4}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Provide summary of study outcomes, key findings, overall assessment, and any lessons learned..."
            />
            {errors.closureComments && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.closureComments.message}
              </p>
            )}
          </div>
        </Card>
      </form>
    </div>
  );
};

export default HAZOPClosure;