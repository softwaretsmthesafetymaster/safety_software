import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Lightbulb,
  AlertTriangle,
  CheckSquare,
  Camera
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchAuditById, updateAudit } from '../../store/slices/auditSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface ObservationData {
  findings: Array<{
    type: string;
    severity: string;
    clause: string;
    description: string;
    evidence: string;
    rootCause: string;
    recommendation: string;
    riskLevel: string;
    riskScore: number;
    correctiveAction: {
      action: string;
      assignedTo: string;
      dueDate: string;
      priority: string;
    };
  }>;
}

const AuditObservationForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAudit, isLoading } = useAppSelector((state) => state.audit);
  const { users } = useAppSelector((state) => state.user);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<ObservationData>({
    defaultValues: {
      findings: [{
        type: '',
        severity: '',
        clause: '',
        description: '',
        evidence: '',
        rootCause: '',
        recommendation: '',
        riskLevel: '',
        riskScore: 0,
        correctiveAction: {
          action: '',
          assignedTo: '',
          dueDate: '',
          priority: ''
        }
      }]
    }
  });

  const { fields: findingFields, append: appendFinding, remove: removeFinding } = useFieldArray({
    control,
    name: 'findings'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchAuditById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: ObservationData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateAudit({
        companyId: user.companyId,
        id,
        data: {
          findings: data.findings,
          status: 'completed'
        }
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Audit observations saved successfully'
      }));
      navigate(`/audit/audits/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save observations'
      }));
    }
  };

  const findingTypes = [
    { value: 'non_compliance', label: 'Non-Compliance', color: 'text-red-600' },
    { value: 'observation', label: 'Observation', color: 'text-blue-600' },
    { value: 'opportunity', label: 'Opportunity for Improvement', color: 'text-purple-600' },
  ];

  const severityLevels = [
    { value: 'minor', label: 'Minor' },
    { value: 'major', label: 'Major' },
    { value: 'critical', label: 'Critical' },
  ];

  const riskLevels = [
    { value: 'low', label: 'Low', score: 1 },
    { value: 'medium', label: 'Medium', score: 2 },
    { value: 'high', label: 'High', score: 3 },
    { value: 'very_high', label: 'Very High', score: 4 },
  ];

  const getAIRecommendations = async (findingIndex: number) => {
    const finding = watch(`findings.${findingIndex}.description`);
    const standard = currentAudit?.standard;
    
    if (finding && standard) {
      // Mock AI suggestions - replace with actual AI service
      const suggestions = [
        'Implement documented procedure for this process',
        'Provide additional training to relevant personnel',
        'Establish regular monitoring and review process',
        'Create checklist for compliance verification',
        'Assign responsible person for ongoing compliance'
      ];
      setAiSuggestions(suggestions);
    }
  };

  const calculateRiskScore = (findingIndex: number) => {
    const severity = watch(`findings.${findingIndex}.severity`);
    const riskLevel = watch(`findings.${findingIndex}.riskLevel`);
    
    if (severity && riskLevel) {
      const severityScore = severityLevels.findIndex(s => s.value === severity) + 1;
      const riskScore = riskLevels.find(r => r.value === riskLevel)?.score || 1;
      const totalScore = severityScore * riskScore;
      
      setValue(`findings.${findingIndex}.riskScore`, totalScore);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit Observations
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAudit?.title} - Record audit findings and observations
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
            Save Observations
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Findings */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Audit Findings
            </h2>
            <Button
              type="button"
              variant="secondary"
              icon={Plus}
              onClick={() => appendFinding({
                type: '',
                severity: '',
                clause: '',
                description: '',
                evidence: '',
                rootCause: '',
                recommendation: '',
                riskLevel: '',
                riskScore: 0,
                correctiveAction: {
                  action: '',
                  assignedTo: '',
                  dueDate: '',
                  priority: ''
                }
              })}
            >
              Add Finding
            </Button>
          </div>

          <div className="space-y-6">
            {findingFields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white">
                    Finding {index + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      icon={Lightbulb}
                      onClick={() => getAIRecommendations(index)}
                    >
                      AI Suggestions
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeFinding(index)}
                      disabled={findingFields.length === 1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Finding Type *
                    </label>
                    <select
                      {...register(`findings.${index}.type` as const, { required: 'Type is required' })}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Type</option>
                      {findingTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Severity
                    </label>
                    <select
                      {...register(`findings.${index}.severity` as const, {
                        onChange: () => calculateRiskScore(index)
                      })}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Clause Reference
                    </label>
                    <input
                      {...register(`findings.${index}.clause` as const)}
                      type="text"
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="e.g., 4.1.1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description *
                    </label>
                    <textarea
                      {...register(`findings.${index}.description` as const, { required: 'Description is required' })}
                      rows={3}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Detailed description of the finding..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Evidence
                      </label>
                      <textarea
                        {...register(`findings.${index}.evidence` as const)}
                        rows={2}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Evidence supporting this finding..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Root Cause
                      </label>
                      <textarea
                        {...register(`findings.${index}.rootCause` as const)}
                        rows={2}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Root cause analysis..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Risk Level
                      </label>
                      <select
                        {...register(`findings.${index}.riskLevel` as const, {
                          onChange: () => calculateRiskScore(index)
                        })}
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Select Risk Level</option>
                        {riskLevels.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Risk Score
                      </label>
                      <input
                        {...register(`findings.${index}.riskScore` as const, { valueAsNumber: true })}
                        type="number"
                        readOnly
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Legal Standard
                      </label>
                      <input
                        {...register(`findings.${index}.legalStandard` as const)}
                        type="text"
                        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="e.g., ISO 45001:2018"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Recommendation *
                    </label>
                    <textarea
                      {...register(`findings.${index}.recommendation` as const, { required: 'Recommendation is required' })}
                      rows={3}
                      className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      placeholder="Recommended corrective actions..."
                    />
                  </div>

                  {/* Corrective Action Assignment */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Corrective Action Assignment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Action *
                        </label>
                        <input
                          {...register(`findings.${index}.correctiveAction.action` as const, { required: 'Action is required' })}
                          type="text"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Corrective action..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Assigned To *
                        </label>
                        <select
                          {...register(`findings.${index}.correctiveAction.assignedTo` as const, { required: 'Assignment is required' })}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Person</option>
                          {users.map((user) => (
                            <option key={user._id} value={user._id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Due Date *
                        </label>
                        <input
                          {...register(`findings.${index}.correctiveAction.dueDate` as const, { required: 'Due date is required' })}
                          type="date"
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Priority *
                        </label>
                        <select
                          {...register(`findings.${index}.correctiveAction.priority` as const, { required: 'Priority is required' })}
                          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* AI Recommendations Panel */}
        {aiSuggestions.length > 0 && (
          <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              AI Recommendations
            </h3>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckSquare className="h-4 w-4 text-green-500 mt-0.5" />
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

export default AuditObservationForm;