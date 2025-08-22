import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Target,
  AlertTriangle,
  Lightbulb,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHIRAById, updateHIRAAssessment } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface WorksheetData {
  activities: Array<{
    activity: string;
    hazards: Array<{
      hazard: string;
      category: string;
      source: string;
      potentialConsequences: string[];
      existingControls: string[];
      probability: number;
      severity: number;
      exposure: number;
      riskScore: number;
      riskLevel: string;
      acceptability: string;
      additionalControls: Array<{
        control: string;
        type: string;
        responsibility: string;
        targetDate: string;
        status: string;
      }>;
      residualRisk: {
        probability: number;
        severity: number;
        exposure: number;
        score: number;
        level: string;
      };
    }>;
  }>;
}

const HIRAWorksheet: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { users } = useAppSelector((state) => state.user);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const { register, handleSubmit, control, watch, setValue } = useForm<WorksheetData>({
    defaultValues: {
      activities: [{
        activity: '',
        hazards: [{
          hazard: '',
          category: 'chemical',
          source: '',
          potentialConsequences: [''],
          existingControls: [''],
          probability: 1,
          severity: 1,
          exposure: 1,
          riskScore: 1,
          riskLevel: 'very_low',
          acceptability: 'acceptable',
          additionalControls: [{
            control: '',
            type: 'elimination',
            responsibility: '',
            targetDate: '',
            status: 'planned'
          }],
          residualRisk: {
            probability: 1,
            severity: 1,
            exposure: 1,
            score: 1,
            level: 'very_low'
          }
        }]
      }]
    }
  });

  const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
    control,
    name: 'activities'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: WorksheetData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateHIRAAssessment({
        companyId: user.companyId,
        id,
        data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'HIRA worksheet updated successfully'
      }));
      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update worksheet'
      }));
    }
  };

  const hazardCategories = [
    { value: 'chemical', label: 'Chemical' },
    { value: 'physical', label: 'Physical' },
    { value: 'biological', label: 'Biological' },
    { value: 'ergonomic', label: 'Ergonomic' },
    { value: 'psychosocial', label: 'Psychosocial' }
  ];

  const controlTypes = [
    { value: 'elimination', label: 'Elimination' },
    { value: 'substitution', label: 'Substitution' },
    { value: 'engineering', label: 'Engineering Controls' },
    { value: 'administrative', label: 'Administrative Controls' },
    { value: 'ppe', label: 'Personal Protective Equipment' }
  ];

  const calculateRiskScore = (activityIndex: number, hazardIndex: number) => {
    const probability = watch(`activities.${activityIndex}.hazards.${hazardIndex}.probability`);
    const severity = watch(`activities.${activityIndex}.hazards.${hazardIndex}.severity`);
    const exposure = watch(`activities.${activityIndex}.hazards.${hazardIndex}.exposure`);
    
    const score = probability * severity * exposure;
    
    // Auto-update risk level and acceptability
    let riskLevel = 'very_low';
    let acceptability = 'acceptable';
    
    if (score <= 30) {
      riskLevel = 'very_low';
      acceptability = 'acceptable';
    } else if (score <= 60) {
      riskLevel = 'low';
      acceptability = 'acceptable';
    } else if (score <= 90) {
      riskLevel = 'moderate';
      acceptability = 'tolerable';
    } else if (score <= 120) {
      riskLevel = 'high';
      acceptability = 'unacceptable';
    } else {
      riskLevel = 'very_high';
      acceptability = 'unacceptable';
    }
    
    setValue(`activities.${activityIndex}.hazards.${hazardIndex}.riskScore`, score);
    setValue(`activities.${activityIndex}.hazards.${hazardIndex}.riskLevel`, riskLevel);
    setValue(`activities.${activityIndex}.hazards.${hazardIndex}.acceptability`, acceptability);
  };

  const getAIRecommendations = async (activityIndex: number, hazardIndex: number) => {
    const hazard = watch(`activities.${activityIndex}.hazards.${hazardIndex}.hazard`);
    const category = watch(`activities.${activityIndex}.hazards.${hazardIndex}.category`);
    
    if (hazard && category) {
      // Mock AI suggestions - replace with actual AI service
      const suggestions = [
        'Implement proper ventilation system',
        'Provide appropriate PPE training',
        'Establish emergency response procedures',
        'Regular equipment maintenance schedule',
        'Install safety monitoring systems'
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
            HIRA Worksheet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/hira/assessments/${id}`)}
          >
            Back to Assessment
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Save Worksheet
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Activities */}
        {activityFields.map((activityField, activityIndex) => (
          <Card key={activityField.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Activity {activityIndex + 1}
              </h3>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => removeActivity(activityIndex)}
                disabled={activityFields.length === 1}
              >
                Remove Activity
              </Button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Activity Description
              </label>
              <input
                {...register(`activities.${activityIndex}.activity` as const)}
                type="text"
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Describe the activity..."
              />
            </div>

            {/* Hazards Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hazard</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Consequences</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Controls</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk Scoring</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AI</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr>
                    <td className="px-4 py-2">
                      <input
                        {...register(`activities.${activityIndex}.hazards.0.hazard` as const)}
                        type="text"
                        className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Identify hazard..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        {...register(`activities.${activityIndex}.hazards.0.category` as const)}
                        className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      >
                        {hazardCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <textarea
                        {...register(`activities.${activityIndex}.hazards.0.potentialConsequences.0` as const)}
                        rows={2}
                        className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Potential consequences..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <textarea
                        {...register(`activities.${activityIndex}.hazards.0.existingControls.0` as const)}
                        rows={2}
                        className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Existing controls..."
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-1">
                          <input
                            {...register(`activities.${activityIndex}.hazards.0.probability` as const, { 
                              valueAsNumber: true,
                              onChange: () => calculateRiskScore(activityIndex, 0)
                            })}
                            type="number"
                            min="1"
                            max="5"
                            className="block w-full rounded border-gray-300 dark:border-gray-600 text-xs focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            placeholder="P"
                          />
                          <input
                            {...register(`activities.${activityIndex}.hazards.0.severity` as const, { 
                              valueAsNumber: true,
                              onChange: () => calculateRiskScore(activityIndex, 0)
                            })}
                            type="number"
                            min="1"
                            max="5"
                            className="block w-full rounded border-gray-300 dark:border-gray-600 text-xs focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            placeholder="S"
                          />
                          <input
                            {...register(`activities.${activityIndex}.hazards.0.exposure` as const, { 
                              valueAsNumber: true,
                              onChange: () => calculateRiskScore(activityIndex, 0)
                            })}
                            type="number"
                            min="1"
                            max="5"
                            className="block w-full rounded border-gray-300 dark:border-gray-600 text-xs focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                            placeholder="E"
                          />
                        </div>
                        <div className="text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            watch(`activities.${activityIndex}.hazards.0.riskLevel`) === 'very_high' ? 'bg-red-100 text-red-800' :
                            watch(`activities.${activityIndex}.hazards.0.riskLevel`) === 'high' ? 'bg-orange-100 text-orange-800' :
                            watch(`activities.${activityIndex}.hazards.0.riskLevel`) === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            watch(`activities.${activityIndex}.hazards.0.riskLevel`) === 'low' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {watch(`activities.${activityIndex}.hazards.0.riskScore`) || 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={Lightbulb}
                        onClick={() => getAIRecommendations(activityIndex, 0)}
                      >
                        AI
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Controls */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Additional Control Measures
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Control Measure
                  </label>
                  <input
                    {...register(`activities.${activityIndex}.hazards.0.additionalControls.0.control` as const)}
                    type="text"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Control measure..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Type
                  </label>
                  <select
                    {...register(`activities.${activityIndex}.hazards.0.additionalControls.0.type` as const)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    {controlTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Responsibility
                  </label>
                  <select
                    {...register(`activities.${activityIndex}.hazards.0.additionalControls.0.responsibility` as const)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Person</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Target Date
                  </label>
                  <input
                    {...register(`activities.${activityIndex}.hazards.0.additionalControls.0.targetDate` as const)}
                    type="date"
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    {...register(`activities.${activityIndex}.hazards.0.additionalControls.0.status` as const)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {/* Add Activity Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => appendActivity({
              activity: '',
              hazards: [{
                hazard: '',
                category: 'chemical',
                source: '',
                potentialConsequences: [''],
                existingControls: [''],
                probability: 1,
                severity: 1,
                exposure: 1,
                riskScore: 1,
                riskLevel: 'very_low',
                acceptability: 'acceptable',
                additionalControls: [{
                  control: '',
                  type: 'elimination',
                  responsibility: '',
                  targetDate: '',
                  status: 'planned'
                }],
                residualRisk: {
                  probability: 1,
                  severity: 1,
                  exposure: 1,
                  score: 1,
                  level: 'very_low'
                }
              }]
            })}
          >
            Add Activity
          </Button>
        </div>

        {/* AI Recommendations Panel */}
        {aiSuggestions.length > 0 && (
          <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              AI Control Recommendations
            </h3>
            <div className="space-y-2">
              {aiSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
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

export default HIRAWorksheet;