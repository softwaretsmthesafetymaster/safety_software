import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  Download,
  Users
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { DownloadService } from '../../services/hira/downloadService';
import { closeHIRAAssessment, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

const HIRAClosure: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);

  const [closureComments, setClosureComments] = useState('');

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const handleClose = async () => {
    try {
      await dispatch(closeHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        comments: closureComments
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Assessment closed successfully'
      }));

      navigate('/hira/assessments');
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to close assessment'
      }));
    }
  };

  const handleDownload = async (format: 'pdf' | 'excel' | 'word') => {
    try {
      await DownloadService.download(format, currentAssessment);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to download assessment'
      }));
    }
  };

  const getActionsSummary = () => {
    if (!currentAssessment?.worksheetRows) return null;

    const openActions = currentAssessment.worksheetRows.filter(row => 
      row.recommendation && row.actionStatus !== 'Completed'
    );
    const completedActions = currentAssessment.worksheetRows.filter(row => 
      row.actionStatus === 'Completed'
    );

    return { openActions, completedActions };
  };

  const actionsSummary = getActionsSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Close HIRA Assessment
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
          </p>
        </div>
      </div>

      {/* Closure Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Assessment Summary
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assessment Number
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                  {currentAssessment?.assessmentNumber}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Status
                </label>
                <p className="mt-1">
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                    {currentAssessment?.status?.toUpperCase()}
                  </span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Approved Date
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment?.approvedAt ? 
                    format(new Date(currentAssessment.approvedAt), 'MMM dd, yyyy') : 
                    'Not approved'
                  }
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Approved By
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {currentAssessment?.approvedBy?.name || 'Not approved'}
                </p>
              </div>
            </div>

            {/* Actions Status */}
            {actionsSummary && (
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
                  Action Items Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                      Open Actions
                    </h4>
                    <p className="text-2xl font-bold text-orange-600">
                      {actionsSummary.openActions.length}
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-200">
                      Recommendations requiring follow-up
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Completed Actions
                    </h4>
                    <p className="text-2xl font-bold text-green-600">
                      {actionsSummary.completedActions.length}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      Actions successfully implemented
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Closure Comments */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Closure Comments
              </label>
              <textarea
                value={closureComments}
                onChange={(e) => setClosureComments(e.target.value)}
                rows={4}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Enter comments about the assessment closure..."
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => navigate(`/hira/assessments/${id}`)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                icon={CheckCircle}
                onClick={handleClose}
                loading={isLoading}
              >
                Close Assessment
              </Button>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Closure Checklist
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Assessment approved</span>
              </div>
              <div className={`flex items-center space-x-3 ${
                actionsSummary?.openActions.length === 0 ? 'opacity-100' : 'opacity-50'
              }`}>
                {actionsSummary?.openActions.length === 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm text-gray-900 dark:text-white">
                  All actions completed
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm text-gray-900 dark:text-white">Review completed</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Final Reports
            </h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                icon={Download}
                className="w-full"
                onClick={() => handleDownload('pdf')}
              >PDF</Button>
              <Button
                variant="secondary"
                icon={Download}
                className="w-full"
                onClick={() => handleDownload('excel')}
              >Excel</Button>
              <Button
                variant="secondary"
                icon={Download}
                className="w-full"
                onClick={() =>handleDownload('word')}
              >Word</Button>

            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HIRAClosure;