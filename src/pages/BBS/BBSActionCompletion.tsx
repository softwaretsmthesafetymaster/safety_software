import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  CheckCircle,
  Upload,
  Star,
  Lightbulb,
  Camera,
  FileText
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { bbsService, BBSReport } from '../../services/bbs/bbsService';
import { format } from 'date-fns';

interface CompletionFormData {
  completionEvidence: string;
  effectivenessRating: number;
  lessonsLearned: string;
  completionComments: string;
  evidencePhotos: string[];
}

const BBSActionComplete: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [report, setReport] = useState<BBSReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [myAction, setMyAction] = useState<any>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CompletionFormData>({
    defaultValues: {
      effectivenessRating: 5,
      evidencePhotos: []
    }
  });

  const watchRating = watch('effectivenessRating');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    if (!id || !user?.companyId) return;
    
    try {
      setLoading(true);
      const fetchedReport = await bbsService.getBBSById(user.companyId, id);
      setReport(fetchedReport);
      
      // Find the action assigned to current user
      const userAction = fetchedReport.correctiveActions?.find(
        (action: any) => action.assignedTo?._id === user.id
      );
      setMyAction(userAction);
      
      if (!userAction) {
        navigate('/bbs/observations');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      navigate('/bbs/observations');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (files: FileList) => {
    try {
      const urls = await bbsService.uploadFiles(files);
      setUploadedPhotos(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
    }
  };

  const onSubmit = async (data: CompletionFormData) => {
    if (!id || !user?.companyId) return;
    
    try {
      setSubmitting(true);
      const completionData = {
        ...data,
        evidencePhotos: uploadedPhotos
      };
      
      await bbsService.completeBBSAction(user.companyId, id, completionData);
      navigate(`/bbs/observations/${id}`);
    } catch (error) {
      console.error('Error completing action:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!report || !myAction) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Action not found or not assigned to you
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
            Complete Corrective Action
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Submit completion details for {report.reportNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Action Assignment
            </h2>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    Assigned Action
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {myAction.action}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  myAction.priority === 'critical' ? 'bg-red-100 text-red-800' :
                  myAction.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  myAction.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {myAction.priority.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Due Date:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(myAction.dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {myAction.status.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Completion Form */}
          <Card className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Action Completion Details
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Completion Evidence *
                </label>
                <textarea
                  {...register('completionEvidence', { 
                    required: 'Please describe what was done to complete this action',
                    minLength: { value: 20, message: 'Please provide detailed evidence (at least 20 characters)' }
                  })}
                  rows={5}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Describe in detail what actions were taken, what was implemented, and how the issue was resolved..."
                />
                {errors.completionEvidence && (
                  <p className="mt-1 text-sm text-red-600">{errors.completionEvidence.message}</p>
                )}
              </div>

              {/* Effectiveness Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Effectiveness Rating * ({watchRating}/5)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    {...register('effectivenessRating', { required: 'Rating is required', min: 1, max: 5 })}
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={rating}
                        className={`h-5 w-5 ${
                          rating <= watchRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Rate how effective you believe this action will be in preventing future occurrences
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Lessons Learned
                </label>
                <textarea
                  {...register('lessonsLearned')}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Share any insights or lessons learned during the completion of this action..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Comments
                </label>
                <textarea
                  {...register('completionComments')}
                  rows={3}
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Any additional comments or observations..."
                />
              </div>

              {/* Evidence Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Evidence Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <div>
                    <label htmlFor="evidence-upload" className="cursor-pointer">
                      <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                        Upload evidence photos
                      </span>
                      <input 
                        id="evidence-upload" 
                        type="file" 
                        className="sr-only" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG up to 10MB each
                    </p>
                  </div>
                </div>
                
                {uploadedPhotos.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {uploadedPhotos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/bbs/observations/${id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="success"
                  loading={submitting}
                  icon={CheckCircle}
                >
                  Submit Completion
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Original Observation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Original Observation
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                <p className="text-gray-900 dark:text-white">
                  {report.observationType.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                <p className="text-gray-900 dark:text-white">{report.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Description:</span>
                <p className="text-gray-900 dark:text-white">{report.description}</p>
              </div>
            </div>
          </Card>

          {/* Completion Guidelines */}
          <Card className="p-6 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center mb-3">
              <Lightbulb className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Completion Guidelines
              </h3>
            </div>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-green-600 rounded-full mt-2 mr-2"></span>
                Provide detailed evidence of what was implemented
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-green-600 rounded-full mt-2 mr-2"></span>
                Include photos or documentation where applicable
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-green-600 rounded-full mt-2 mr-2"></span>
                Rate the effectiveness honestly based on expected impact
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-1.5 w-1.5 bg-green-600 rounded-full mt-2 mr-2"></span>
                Share any insights or challenges encountered
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BBSActionComplete;