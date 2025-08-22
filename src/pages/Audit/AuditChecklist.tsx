import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  CheckSquare,
  X,
  Camera,
  Lightbulb,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditById, updateAudit } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface ChecklistData {
  checklist: Array<{
    category: string;
    clause: string;
    requirement: string;
    evidence: string;
    finding: string;
    severity: string;
    description: string;
    photos: string[];
    recommendations: string;
  }>;
}

const AuditChecklist: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const { register, handleSubmit, control, watch } = useForm<ChecklistData>({
    defaultValues: {
      checklist: [
        {
          category: '',
          clause: '',
          requirement: '',
          evidence: '',
          finding: '',
          severity: '',
          description: '',
          photos: [],
          recommendations: ''
        }
      ]
    }
  });

  const { fields: checklistFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'checklist'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ChecklistData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateAudit({
        companyId: user.companyId,
        id,
        data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Audit checklist updated successfully'
      }));
      navigate(`/audit/audits/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update checklist'
      }));
    }
  };

  const findingTypes = [
    { value: 'compliant', label: 'Compliant', color: 'text-green-600' },
    { value: 'non_compliant', label: 'Non-Compliant', color: 'text-red-600' },
    { value: 'observation', label: 'Observation', color: 'text-blue-600' },
    { value: 'opportunity', label: 'Opportunity', color: 'text-purple-600' },
  ];

  const severityLevels = [
    { value: 'minor', label: 'Minor' },
    { value: 'major', label: 'Major' },
    { value: 'critical', label: 'Critical' },
  ];

  const getAIRecommendations = async (itemIndex: number) => {
    const finding = watch(`checklist.${itemIndex}.finding`);
    const description = watch(`checklist.${itemIndex}.description`);
    
    if (finding === 'non_compliant' && description) {
      // Mock AI suggestions - replace with actual AI service
      const suggestions = [
        'Implement immediate corrective action',
        'Provide additional training to personnel',
        'Review and update procedures',
        'Conduct follow-up verification',
        'Assign responsible person for implementation'
      ];
      setAiSuggestions(suggestions);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Checklist
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAudit?.title} - {currentAudit?.auditNumber}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/audit/audits/${id}`)}
          >
            Back to Audit
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Save Checklist
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Checklist Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Checklist Items
            </h2>
            <Button
              type="button"
              variant="secondary"
              icon={CheckSquare}
              onClick={() => appendItem({
                category: '',
                clause: '',
                requirement: '',
                evidence: '',
                finding: '',
                severity: '',
                description: '',
                photos: [],
                recommendations: ''
              })}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-6">
            {checklistFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Checklist Item {index + 1}
                  </h3>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => removeItem(index)}
                    disabled={checklistFields.length === 1}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </label>
                    <input
                      {...register(`checklist.${index}.category` as const)}
                      type="text"
                      placeholder="e.g., Leadership"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clause
                    </label>
                    <input
                      {...register(`checklist.${index}.clause` as const)}
                      type="text"
                      placeholder="e.g., 5.1"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Finding
                    </label>
                    <select
                      {...register(`checklist.${index}.finding` as const)}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Finding</option>
                      {findingTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Requirement
                  </label>
                  <textarea
                    {...register(`checklist.${index}.requirement` as const)}
                    rows={2}
                    placeholder="Describe the requirement being audited..."
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Evidence
                    </label>
                    <textarea
                      {...register(`checklist.${index}.evidence` as const)}
                      rows={3}
                      placeholder="Document evidence found..."
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      {...register(`checklist.${index}.description` as const)}
                      rows={3}
                      placeholder="Detailed description of findings..."
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {watch(`checklist.${index}.finding`) === 'non_compliant' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Severity
                      </label>
                      <select
                        {...register(`checklist.${index}.severity` as const)}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Severity</option>
                        {severityLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={Lightbulb}
                        onClick={() => getAIRecommendations(index)}
                      >
                        Get AI Recommendations
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Recommendations
                  </label>
                  <textarea
                    {...register(`checklist.${index}.recommendations` as const)}
                    rows={2}
                    placeholder="Recommendations for improvement..."
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Photos/Evidence
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                    <Camera className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor={`file-upload-${index}`} className="cursor-pointer">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Upload photos
                        </span>
                        <input 
                          id={`file-upload-${index}`} 
                          type="file" 
                          className="sr-only" 
                          multiple 
                          accept="image/*" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        {aiSuggestions.length > 0 && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              AI Recommendations
            </h3>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckSquare className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {suggestion}
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

export default AuditChecklist;