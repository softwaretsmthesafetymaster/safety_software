import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Target,
  Brain,
  Download,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  fetchHAZOPById,
  createWorksheet,
  updateWorksheet,
  getAISuggestions
} from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface WorksheetFormData {
  nodeNumber: string;
  worksheets: Array<{
    parameter: string;
    guideWord: string;
    deviation: string;
    causes: string[];
    consequences: string[];
    severity: number;
    likelihood: number;
    risk: string;
    riskScore: number;
    safeguards: string[];
    recommendations: Array<{
      action: string;
      type: 'immediate' | 'short_term' | 'long_term';
      priority: 'low' | 'medium' | 'high' | 'critical';
      responsibility: string;
      targetDate: string;
    }>;
  }>;
}

const HAZOPWorksheet: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const nodeNumber = searchParams.get('node');
  
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading, aiSuggestions } = useAppSelector((state) => state.hazop);
  const [selectedWorksheet, setSelectedWorksheet] = useState(0);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
 
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<WorksheetFormData>({
    defaultValues: {
      nodeNumber: nodeNumber || '',
      worksheets: [{
        parameter: '',
        guideWord: '',
        deviation: '',
        causes: [''],
        consequences: [''],
        severity: 1,
        likelihood: 1,
        risk: 'very_low',
        riskScore: 1,
        safeguards: [''],
        recommendations: []
      }]
    }
  });

  const { fields: worksheetFields, append: appendWorksheet, remove: removeWorksheet } = useFieldArray({
    control,
    name: 'worksheets'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentStudy && nodeNumber) {
      const node = currentStudy.nodes?.find((n: any) => n.nodeNumber === nodeNumber);
      if (node && node.worksheets?.length > 0) {
        setValue('worksheets', node.worksheets);
      }
    }
  }, [currentStudy, nodeNumber, setValue]);

  const guideWords = [
    'NO/NOT', 'MORE', 'LESS', 'AS WELL AS', 'PART OF', 'REVERSE', 'OTHER THAN', 'EARLY', 'LATE', 'BEFORE', 'AFTER'
  ];

  const parameters = [
    'FLOW', 'PRESSURE', 'TEMPERATURE', 'LEVEL', 'COMPOSITION', 'VISCOSITY', 'PHASE', 'REACTION', 'MIXING', 'SEPARATION'
  ];

  const severityLevels = [
    { value: 1, label: 'Negligible', color: 'bg-green-500' },
    { value: 2, label: 'Minor', color: 'bg-yellow-500' },
    { value: 3, label: 'Moderate', color: 'bg-orange-500' },
    { value: 4, label: 'Major', color: 'bg-red-500' },
    { value: 5, label: 'Catastrophic', color: 'bg-red-700' }
  ];

  const likelihoodLevels = [
    { value: 1, label: 'Rare', color: 'bg-green-500' },
    { value: 2, label: 'Unlikely', color: 'bg-yellow-500' },
    { value: 3, label: 'Possible', color: 'bg-orange-500' },
    { value: 4, label: 'Likely', color: 'bg-red-500' },
    { value: 5, label: 'Almost Certain', color: 'bg-red-700' }
  ];

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 4) return 'bg-green-500 text-white';
    if (riskScore <= 8) return 'bg-yellow-500 text-white';
    if (riskScore <= 15) return 'bg-orange-500 text-white';
    if (riskScore <= 20) return 'bg-red-500 text-white';
    return 'bg-red-700 text-white';
  };

  const getRiskLevel = (riskScore: number) => {
    if (riskScore <= 4) return 'Very Low';
    if (riskScore <= 8) return 'Low';
    if (riskScore <= 15) return 'Medium';
    if (riskScore <= 20) return 'High';
    return 'Very High';
  };

  const calculateRisk = (worksheetIndex: number) => {
    const worksheet = watch(`worksheets.${worksheetIndex}`);
    const riskScore = worksheet.severity * worksheet.likelihood;
    setValue(`worksheets.${worksheetIndex}.riskScore`, riskScore);
    setValue(`worksheets.${worksheetIndex}.risk`, getRiskLevel(riskScore).toLowerCase().replace(' ', '_'));
  };

  const getSuggestions = async (worksheetIndex: number) => {
    
    const worksheet = watch(`worksheets.${worksheetIndex}`);
    if (!worksheet.parameter || !worksheet.guideWord) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please select parameter and guide word first'
      }));
      return;
    }

    try {
      await dispatch(getAISuggestions({
        companyId: user?.companyId!,
        studyId: id!,
        parameter: worksheet.parameter,
        guideWord: worksheet.guideWord,
        process: currentStudy?.process?.name || ''
      })).unwrap();
      setShowAISuggestions(true);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to get AI suggestions'
      }));
    }
  };

  const applyAISuggestion = (type: 'causes' | 'consequences' | 'safeguards', suggestion: string) => {
    const currentValues = watch(`worksheets.${selectedWorksheet}.${type}`) || [''];
    if (!currentValues.includes(suggestion)) {
      setValue(`worksheets.${selectedWorksheet}.${type}`, [...currentValues.filter(v => v), suggestion]);
    }
  };

  const addArrayField = (worksheetIndex: number, fieldName: 'causes' | 'consequences' | 'safeguards') => {
    const currentValues = watch(`worksheets.${worksheetIndex}.${fieldName}`) || [];
    setValue(`worksheets.${worksheetIndex}.${fieldName}`, [...currentValues, '']);
  };

  const removeArrayField = (worksheetIndex: number, fieldName: 'causes' | 'consequences' | 'safeguards', index: number) => {
    const currentValues = watch(`worksheets.${worksheetIndex}.${fieldName}`) || [];
    setValue(`worksheets.${worksheetIndex}.${fieldName}`, currentValues.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: WorksheetFormData) => {
    if (!user?.companyId || !id) return;
    try {
      console.log(data.worksheets);
      await dispatch(createWorksheet({
        companyId: user.companyId,
        studyId: id,
        nodeNumber: currentNode?._id,
        worksheets: data.worksheets
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Worksheet saved successfully'
      }));

      navigate(`/hazop/studies/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to save worksheet'
      }));
    }
  };

  const currentNode = currentStudy?.nodes?.find(n => n.nodeNumber === nodeNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            icon={ArrowLeft}
            // onClick={() => navigate(`/hazop/studies/${id}`)}
            onClick={() => navigate(-1)}
          >
            Back to Study
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              HAZOP Worksheet - {nodeNumber}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentNode?.description || 'Node Description'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => appendWorksheet({
              parameter: '',
              guideWord: '',
              deviation: '',
              causes: [''],
              consequences: [''],
              severity: 1,
              likelihood: 1,
              risk: 'very_low',
              riskScore: 1,
              safeguards: [''],
              recommendations: []
            })}
          >
            Add Row
          </Button>
          <Button
            variant="primary"
            icon={Save}
            onClick={handleSubmit(onSubmit)}
            loading={isLoading}
          >
            Save Worksheet
          </Button>
        </div>
      </div>

      {/* Node Information */}
      {currentNode && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Node:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{currentNode.nodeNumber}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Design Intention:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{currentNode.intention}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Equipment:</span>
              <span className="ml-2 text-gray-900 dark:text-white">{currentNode.equipment?.join(', ')}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Worksheet Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Parameter
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Guide Word
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Deviation
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Causes
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Consequences
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Severity
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Likelihood
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Risk
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Safeguards
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Recommendations
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  AI
                </th>
                <th className="border border-gray-300 dark:border-gray-600 p-3 text-left text-sm font-medium text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {worksheetFields.map((field, worksheetIndex) => (
                <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {/* Parameter */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <select
                      {...register(`worksheets.${worksheetIndex}.parameter` as const)}
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select</option>
                      {parameters.map(param => (
                        <option key={param} value={param}>{param}</option>
                      ))}
                    </select>
                  </td>

                  {/* Guide Word */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <select
                      {...register(`worksheets.${worksheetIndex}.guideWord` as const)}
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select</option>
                      {guideWords.map(word => (
                        <option key={word} value={word}>{word}</option>
                      ))}
                    </select>
                  </td>

                  {/* Deviation */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <input
                      {...register(`worksheets.${worksheetIndex}.deviation` as const)}
                      type="text"
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Describe deviation"
                    />
                  </td>

                  {/* Causes */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <div className="space-y-1">
                      {(watch(`worksheets.${worksheetIndex}.causes`) || ['']).map((_, causeIndex) => (
                        <div key={causeIndex} className="flex items-center space-x-1">
                          <input
                            {...register(`worksheets.${worksheetIndex}.causes.${causeIndex}` as const)}
                            type="text"
                            className="flex-1 text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="Cause"
                          />
                          {causeIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField(worksheetIndex, 'causes', causeIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField(worksheetIndex, 'causes')}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        + Add Cause
                      </button>
                    </div>
                  </td>

                  {/* Consequences */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <div className="space-y-1">
                      {(watch(`worksheets.${worksheetIndex}.consequences`) || ['']).map((_, consIndex) => (
                        <div key={consIndex} className="flex items-center space-x-1">
                          <input
                            {...register(`worksheets.${worksheetIndex}.consequences.${consIndex}` as const)}
                            type="text"
                            className="flex-1 text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="Consequence"
                          />
                          {consIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField(worksheetIndex, 'consequences', consIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField(worksheetIndex, 'consequences')}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        + Add Consequence
                      </button>
                    </div>
                  </td>

                  {/* Severity */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <select
                      {...register(`worksheets.${worksheetIndex}.severity` as const, { 
                        valueAsNumber: true,
                        onChange: () => calculateRisk(worksheetIndex)
                      })}
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      {severityLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Likelihood */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <select
                      {...register(`worksheets.${worksheetIndex}.likelihood` as const, { 
                        valueAsNumber: true,
                        onChange: () => calculateRisk(worksheetIndex)
                      })}
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      {likelihoodLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.value} - {level.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Risk */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(watch(`worksheets.${worksheetIndex}.riskScore`) || 1)}`}>
                        {watch(`worksheets.${worksheetIndex}.riskScore`) || 1}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {getRiskLevel(watch(`worksheets.${worksheetIndex}.riskScore`) || 1)}
                      </span>
                    </div>
                  </td>

                  {/* Safeguards */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <div className="space-y-1">
                      {(watch(`worksheets.${worksheetIndex}.safeguards`) || ['']).map((_, sgIndex) => (
                        <div key={sgIndex} className="flex items-center space-x-1">
                          <input
                            {...register(`worksheets.${worksheetIndex}.safeguards.${sgIndex}` as const)}
                            type="text"
                            className="flex-1 text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            placeholder="Safeguard"
                          />
                          {sgIndex > 0 && (
                            <button
                              type="button"
                              onClick={() => removeArrayField(worksheetIndex, 'safeguards', sgIndex)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addArrayField(worksheetIndex, 'safeguards')}
                        className="text-blue-500 hover:text-blue-700 text-sm"
                      >
                        + Add Safeguard
                      </button>
                    </div>
                  </td>

                  {/* Recommendations */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <textarea
                      {...register(`worksheets.${worksheetIndex}.recommendations.0.action` as const)}
                      rows={2}
                      className="w-full text-sm rounded border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Recommendations..."
                    />
                  </td>

                  {/* AI Button */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={Brain}
                      onClick={() => {
                        setSelectedWorksheet(worksheetIndex);
                        getSuggestions(worksheetIndex);
                      }}
                      className="w-full"
                    >
                      AI
                    </Button>
                  </td>

                  {/* Actions */}
                  <td className="border border-gray-300 dark:border-gray-600 p-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeWorksheet(worksheetIndex)}
                      disabled={worksheetFields.length === 1}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Suggestions Panel */}
      {showAISuggestions && aiSuggestions && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Brain className="h-5 w-5 mr-2 text-blue-500" />
              AI Suggestions
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAISuggestions(false)}
            >
              Close
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Causes */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Causes</h4>
              <div className="space-y-2">
                {aiSuggestions.causes?.map((cause, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{cause}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => applyAISuggestion('causes', cause)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Consequences */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Consequences</h4>
              <div className="space-y-2">
                {aiSuggestions.consequences?.map((consequence, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{consequence}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => applyAISuggestion('consequences', consequence)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Safeguards */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suggested Safeguards</h4>
              <div className="space-y-2">
                {aiSuggestions.safeguards?.map((safeguard, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">{safeguard}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => applyAISuggestion('safeguards', safeguard)}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            AI Confidence: {Math.round((aiSuggestions.confidence || 0) * 100)}%
          </div>
        </Card>
      )}
    </div>
  );
};

export default HAZOPWorksheet;