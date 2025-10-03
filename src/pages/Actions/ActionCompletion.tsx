import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  Upload,
  Camera,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ActionCompletionData {
  completionEvidence: string;
  completionComments: string;
  effectivenessRating: number;
  lessonsLearned: string;
  completionPhotos: string[];
  completionDocuments: string[];
}

const ActionCompletion: React.FC = () => {
  const { module, itemId, actionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState<any>(null);
  const [action, setAction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<ActionCompletionData>();

  useEffect(() => {
    fetchItemAndAction();
  }, [module, itemId, actionId]);

  const fetchItemAndAction = async () => {
    if (!user?.companyId || !module || !itemId) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/${module}/${user.companyId}/${itemId}`);
      const itemData = response.data[Object.keys(response.data)[0]]; // Get the item from response
      setItem(itemData);

      // Find the specific action
      let foundAction = null;
      if (module === 'ims' && itemData.correctiveActions) {
        foundAction = itemData.correctiveActions.find((a: any) => a._id === actionId);
      } else if (module === 'bbs' && itemData.correctiveActions) {
        foundAction = itemData.correctiveActions.find((a: any) => a._id === actionId);
      } else if (module === 'audit' && itemData.findings) {
        const finding = itemData.findings.find((f: any) => f.correctiveAction?._id === actionId);
        foundAction = finding?.correctiveAction;
      } else if (module === 'hazop' && itemData.nodes) {
        for (const node of itemData.nodes) {
          for (const worksheet of node.worksheets || []) {
            foundAction = worksheet.recommendations?.find((r: any) => r._id === actionId);
            if (foundAction) break;
          }
          if (foundAction) break;
        }
      } else if (module === 'hira' && itemData.activities) {
        for (const activity of itemData.activities) {
          for (const hazard of activity.hazards || []) {
            foundAction = hazard.additionalControls?.find((c: any) => c._id === actionId);
            if (foundAction) break;
          }
          if (foundAction) break;
        }
      }

      setAction(foundAction);
    } catch (error) {
      console.error('Error fetching item:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load action details'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList, type: 'photos' | 'documents') => {
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const urls = response.data.urls;
      setUploadedFiles(prev => [...prev, ...urls]);
      
      dispatch(addNotification({
        type: 'success',
        message: `${type} uploaded successfully`
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: `Failed to upload ${type}`
      }));
    }
  };

  const onSubmit = async (data: ActionCompletionData) => {
    if (!user?.companyId || !module || !itemId || !actionId) return;

    setIsLoading(true);
    try {
      const completionData = {
        ...data,
        completionPhotos: uploadedFiles.filter(f => f.includes('image')),
        completionDocuments: uploadedFiles.filter(f => !f.includes('image')),
        completedBy: user.id,
        completedAt: new Date().toISOString()
      };

      await axios.post(`${API_URL}/${module}/${user.companyId}/${itemId}/actions/${actionId}/complete`, completionData);
      
      dispatch(addNotification({
        type: 'success',
        message: 'Action completion submitted successfully'
      }));
      
      // Navigate back to the item details
      navigate(`/${module}/${module === 'ims' ? 'incidents' : module === 'bbs' ? 'observations' : module === 'audit' ? 'audits' : module === 'hazop' ? 'studies' : 'assessments'}/${itemId}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to submit completion'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !item) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!item || !action) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Action not found
        </h3>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  const getModuleTitle = () => {
    switch (module) {
      case 'ims': return 'Incident';
      case 'bbs': return 'BBS Observation';
      case 'audit': return 'Audit';
      case 'hazop': return 'HAZOP Study';
      case 'hira': return 'HIRA Assessment';
      default: return 'Item';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complete Action
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getModuleTitle()}: {item.incidentNumber || item.reportNumber || item.auditNumber || item.studyNumber || item.assessmentNumber}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Submit Completion
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Action Details */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Action Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-3 rounded-lg">
                {action.action || action.control || action.recommendation}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  action.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {action.priority?.toUpperCase() || 'MEDIUM'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Due Date
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Status
                </label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  action.status === 'completed' ? 'bg-green-100 text-green-800' :
                  action.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {action.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Completion Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Completion Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="completionEvidence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Evidence of Completion *
              </label>
              <textarea
                {...register('completionEvidence', { 
                  required: 'Evidence of completion is required',
                  minLength: { value: 20, message: 'Please provide detailed evidence (minimum 20 characters)' }
                })}
                rows={5}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide detailed evidence of how the action was completed. Include specific steps taken, results achieved, and any measurements or observations..."
              />
              {errors.completionEvidence && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.completionEvidence.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="effectivenessRating" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Effectiveness Rating (1-5) *
              </label>
              <select
                {...register('effectivenessRating', { 
                  required: 'Effectiveness rating is required',
                  valueAsNumber: true
                })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Rating</option>
                <option value="1">1 - Not Effective (Action did not address the issue)</option>
                <option value="2">2 - Slightly Effective (Minimal improvement)</option>
                <option value="3">3 - Moderately Effective (Some improvement)</option>
                <option value="4">4 - Very Effective (Significant improvement)</option>
                <option value="5">5 - Extremely Effective (Complete resolution)</option>
              </select>
              {errors.effectivenessRating && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.effectivenessRating.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="lessonsLearned" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lessons Learned
              </label>
              <textarea
                {...register('lessonsLearned')}
                rows={4}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="What lessons were learned during the implementation of this action? What would you do differently next time?"
              />
            </div>

            <div>
              <label htmlFor="completionComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Comments
              </label>
              <textarea
                {...register('completionComments')}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Any additional comments about the completion, challenges faced, or recommendations for future improvements..."
              />
            </div>
          </div>
        </Card>

        {/* Photo Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Completion Photos
          </h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="photo-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Upload completion photos
                </span>
                <input 
                  id="photo-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'photos')}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PNG, JPG up to 10MB each. Include before/after photos, completion evidence, test results, etc.
              </p>
            </div>
          </div>
        </Card>

        {/* Document Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Supporting Documents
          </h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="doc-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Upload supporting documents
                </span>
                <input 
                  id="doc-upload" 
                  type="file" 
                  className="sr-only" 
                  multiple 
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files, 'documents')}
                />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, XLS up to 10MB each. Include certificates, test reports, procedures, etc.
              </p>
            </div>
          </div>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {file.includes('image') ? (
                    <Camera className="h-5 w-5 text-blue-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-green-500" />
                  )}
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {file.split('/').pop()}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default ActionCompletion;