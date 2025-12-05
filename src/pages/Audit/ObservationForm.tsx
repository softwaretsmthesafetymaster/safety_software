import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  Save,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  FileText,
  Users,
  Calendar,
  Camera
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ObservationFormData {
  observation: string;
  element: string;
  legalStandard: string;
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high' | 'very_low';
  riskScore: number;
  category: 'non_compliance' | 'observation' | 'opportunity';
  severity: 'minor' | 'major' | 'critical';
  responsiblePerson: string;
  targetDate: string;
}

const ObservationForm: React.FC = () => {
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { users } = useAppSelector((state) => state.user);
  
  const [audit, setAudit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<ObservationFormData>({
    defaultValues: {
      riskLevel: 'medium',
      riskScore: 3,
      category: 'observation',
      severity: 'minor'
    }
  });

  const watchObservation = watch('observation');
  const watchRiskLevel = watch('riskLevel');

  useEffect(() => {
    if (auditId && user?.companyId) {
      fetchAudit();
    }
  }, [auditId, user?.companyId]);

  useEffect(() => {
    // Auto-calculate risk score based on risk level
    const riskScores = {
      low: 4,
      very_low: 5,
      medium: 3,
      high: 2,
      very_high: 1
    };
    setValue('riskScore', riskScores[watchRiskLevel]);
  }, [watchRiskLevel, setValue]);

  const fetchAudit = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/audits/${user?.companyId}/${auditId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.data
      setAudit(data.audit);
    } catch (error) {
      console.error('Failed to fetch audit:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load audit details'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!watchObservation || watchObservation.length < 10) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please enter a detailed observation to get AI suggestions'
      }));
      return;
    }

    try {
      setIsGeneratingAI(true);
      const response = await axios.post(`${API_URL}/observations/${user?.companyId}/ai-suggest`, {
        observation: watchObservation,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      const data = await response.data;
      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
        
        // Auto-fill suggested values
        if (data.suggestions.element) {
          setValue('element', data.suggestions.element);
        }
        if (data.suggestions.legalStandard) {
          setValue('legalStandard', data.suggestions.legalStandard);
        }
        if (data.suggestions.recommendation) {
          setValue('recommendation', data.suggestions.recommendation);
        }
        if (data.suggestions.risk) {
          setValue('riskLevel', data.suggestions.risk.toLowerCase());
        }
        if (data.suggestions.riskScore) {
          setValue('riskScore', data.suggestions.riskScore);
        }
        
        dispatch(addNotification({
          type: 'success',
          message: 'AI suggestions generated successfully'
        }));
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to generate AI suggestions'
      }));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: ObservationFormData) => {
    if (!user?.companyId || !auditId) return;

    try {
      setIsSaving(true);
      const response = await axios.post(`${API_URL}/observations/${user.companyId}/audit/${auditId}`, {
        ...data,
        aiSuggestions
      });   
      
      if (response.status === 200) {
        dispatch(addNotification({
          type: 'success',
          message: 'Observation created successfully'
        }));
        navigate(`/audit/audits/${auditId}/manage`);
      } else {
        throw new Error('Failed to create observation');
      }
    } catch (error) {
      console.error('Failed to create observation:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to create observation'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'very_high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Audit not found
        </h3>
        <Button
          onClick={() => navigate('/audit/audits')}
          variant="primary"
          className="mt-4"
        >
          Back to Audits
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={() => navigate(`/audit/audits/${auditId}/manage`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Observation
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {audit.auditNumber} - {audit.title}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Observation Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Observation Details
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observation Description *
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={Sparkles}
                  loading={isGeneratingAI}
                  onClick={generateAISuggestions}
                  disabled={!watchObservation || watchObservation.length < 10}
                >
                  AI Suggestions
                </Button>
              </div>
              <textarea
                {...register('observation', { required: 'Observation is required' })}
                rows={4}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe the observation in detail..."
              />
              {errors.observation && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observation.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Element
                </label>
                <input
                  {...register('element')}
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Safety element or system involved"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Legal Standard
                </label>
                <input
                  {...register('legalStandard')}
                  type="text"
                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="Applicable legal standard or regulation"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendation
              </label>
              <textarea
                {...register('recommendation')}
                rows={3}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Recommended corrective action..."
              />
            </div>
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Risk Assessment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Level *
              </label>
              <select
                {...register('riskLevel', { required: 'Risk level is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </select>
              {errors.riskLevel && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.riskLevel.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Score *
              </label>
              <input
                {...register('riskScore', { 
                  required: 'Risk score is required',
                  min: { value: 1, message: 'Maximum Value is 1' },
                  max: { value: 5, message: 'Minimum Value is 5' }
                })}
                type="number"
                min="1"
                max="5"
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.riskScore && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.riskScore.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Risk Preview
              </label>
              <div className={`p-3 rounded-lg border text-center font-medium ${getRiskColor(watchRiskLevel)}`}>
                {watchRiskLevel?.replace('_', ' ').toUpperCase()} RISK
              </div>
            </div>
          </div>
        </Card>

        {/* Classification */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Classification
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                {...register('category', { required: 'Category is required' })}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="non_compliance">Non-Compliance</option>
                <option value="observation">Observation</option>
                <option value="opportunity">Opportunity for Improvement</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Severity
              </label>
              <select
                {...register('severity')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="minor">Minor</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Assignment */}
        {/* <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Assignment
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsible Person
              </label>
              <select
                {...register('responsiblePerson')}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Responsible Person</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date
              </label>
              <input
                {...register('targetDate')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>
        </Card> */}

        {/* AI Suggestions Display */}
        {aiSuggestions && (
          <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2" />
              AI Suggestions Applied
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {aiSuggestions.element && (
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-300">Element:</span>
                  <p className="text-blue-700 dark:text-blue-400">{aiSuggestions.element}</p>
                </div>
              )}
              {aiSuggestions.legalStandard && (
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-300">Legal Standard:</span>
                  <p className="text-blue-700 dark:text-blue-400">{aiSuggestions.legalStandard}</p>
                </div>
              )}
              {aiSuggestions.recommendation && (
                <div className="md:col-span-2">
                  <span className="font-medium text-blue-800 dark:text-blue-300">Recommendation:</span>
                  <p className="text-blue-700 dark:text-blue-400">{aiSuggestions.recommendation}</p>
                </div>
              )}
              {aiSuggestions.risk && (
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-300">Risk:</span>
                  <p className="text-blue-700 dark:text-blue-400">{aiSuggestions.risk}</p>
                </div>
              )}
              {aiSuggestions.riskScore && (
                <div>
                  <span className="font-medium text-blue-800 dark:text-blue-300">Risk Score:</span>
                  <p className="text-blue-700 dark:text-blue-400">{aiSuggestions.riskScore}</p>
                </div>
              )}
              
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/audit/audits/${auditId}/manage`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isSaving}
            className="min-w-[120px]"
          >
            Create Observation
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ObservationForm;