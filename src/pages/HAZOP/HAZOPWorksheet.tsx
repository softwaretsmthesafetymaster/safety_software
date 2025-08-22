import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Save,
  Plus,
  Trash2,
  Lightbulb,
  AlertTriangle,
  Target,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchHAZOPById, updateHAZOPStudy, getAISuggestions } from '../../store/slices/hazopSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface WorksheetData {
  nodes: Array<{
    nodeNumber: string;
    description: string;
    intention: string;
    equipment: string[];
    worksheets: Array<{
      parameter: string;
      guideWord: string;
      deviation: string;
      causes: string[];
      consequences: string[];
      safeguards: string[];
      likelihood: string;
      severity: string;
      risk: string;
      recommendations: Array<{
        action: string;
        type: string;
        priority: string;
        responsibility: string;
        targetDate: string;
      }>;
    }>;
  }>;
}

const HAZOPWorksheet: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentStudy, isLoading } = useAppSelector((state) => state.hazop);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const { register, handleSubmit, control, watch, setValue } = useForm<WorksheetData>({
    defaultValues: {
      nodes: [{
        nodeNumber: '1',
        description: '',
        intention: '',
        equipment: [''],
        worksheets: [{
          parameter: '',
          guideWord: '',
          deviation: '',
          causes: [''],
          consequences: [''],
          safeguards: [''],
          likelihood: '',
          severity: '',
          risk: '',
          recommendations: [{
            action: '',
            type: '',
            priority: '',
            responsibility: '',
            targetDate: ''
          }]
        }]
      }]
    }
  });

  const { fields: nodeFields, append: appendNode, remove: removeNode } = useFieldArray({
    control,
    name: 'nodes'
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHAZOPById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const parameters = ['Flow', 'Pressure', 'Temperature', 'Level', 'Composition', 'Agitation', 'Reaction', 'Time'];
  const guideWords = ['No/Not', 'More', 'Less', 'As Well As', 'Part Of', 'Reverse', 'Other Than'];
  const likelihoodLevels = ['rare', 'unlikely', 'possible', 'likely', 'almost_certain'];
  const severityLevels = ['negligible', 'minor', 'moderate', 'major', 'catastrophic'];

  const getAISuggestionsForWorksheet = async (nodeIndex: number, worksheetIndex: number) => {
    const parameter = watch(`nodes.${nodeIndex}.worksheets.${worksheetIndex}.parameter`);
    const guideWord = watch(`nodes.${nodeIndex}.worksheets.${worksheetIndex}.guideWord`);
    const process = currentStudy?.process?.name || '';

    if (!parameter || !guideWord || !user?.companyId || !id) return;

    setLoadingAI(true);
    try {
      const suggestions = await dispatch(getAISuggestions({
        companyId: user.companyId,
        id,
        data: { parameter, guideWord, process }
      })).unwrap();

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    } finally {
      setLoadingAI(false);
    }
  };

  const onSubmit = async (data: WorksheetData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(updateHAZOPStudy({
        companyId: user.companyId,
        id,
        data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'HAZOP worksheet updated successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to update worksheet'
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HAZOP Worksheet
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentStudy?.title} - {currentStudy?.studyNumber}
          </p>
        </div>
        <div className="flex items-center space-x-3">
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
        {/* Nodes */}
        {nodeFields.map((nodeField, nodeIndex) => (
          <Card key={nodeField.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Node {nodeIndex + 1}
              </h3>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => removeNode(nodeIndex)}
                disabled={nodeFields.length === 1}
              >
                Remove Node
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Node Number
                </label>
                <input
                  {...register(`nodes.${nodeIndex}.nodeNumber` as const)}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <input
                  {...register(`nodes.${nodeIndex}.description` as const)}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Intention
                </label>
                <input
                  {...register(`nodes.${nodeIndex}.intention` as const)}
                  type="text"
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Worksheets for this node */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Worksheets
              </h4>
              
              {/* Worksheet table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Parameter</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Guide Word</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Deviation</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Causes</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Consequences</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Safeguards</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">AI</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <tr>
                      <td className="px-4 py-2">
                        <select
                          {...register(`nodes.${nodeIndex}.worksheets.0.parameter` as const)}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select</option>
                          {parameters.map(param => (
                            <option key={param} value={param}>{param}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          {...register(`nodes.${nodeIndex}.worksheets.0.guideWord` as const)}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        >
                          <option value="">Select</option>
                          {guideWords.map(word => (
                            <option key={word} value={word}>{word}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          {...register(`nodes.${nodeIndex}.worksheets.0.deviation` as const)}
                          type="text"
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea
                          {...register(`nodes.${nodeIndex}.worksheets.0.causes.0` as const)}
                          rows={2}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea
                          {...register(`nodes.${nodeIndex}.worksheets.0.consequences.0` as const)}
                          rows={2}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <textarea
                          {...register(`nodes.${nodeIndex}.worksheets.0.safeguards.0` as const)}
                          rows={2}
                          className="block w-full rounded border-gray-300 dark:border-gray-600 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-2">
                          <select
                            {...register(`nodes.${nodeIndex}.worksheets.0.likelihood` as const)}
                            className="block w-full rounded border-gray-300 dark:border-gray-600 text-xs focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Likelihood</option>
                            {likelihoodLevels.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                          <select
                            {...register(`nodes.${nodeIndex}.worksheets.0.severity` as const)}
                            className="block w-full rounded border-gray-300 dark:border-gray-600 text-xs focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Severity</option>
                            {severityLevels.map(level => (
                              <option key={level} value={level}>{level}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          icon={Lightbulb}
                          loading={loadingAI}
                          onClick={() => getAISuggestionsForWorksheet(nodeIndex, 0)}
                        >
                          AI
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        ))}

        {/* Add Node Button */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            icon={Plus}
            onClick={() => appendNode({
              nodeNumber: (nodeFields.length + 1).toString(),
              description: '',
              intention: '',
              equipment: [''],
              worksheets: [{
                parameter: '',
                guideWord: '',
                deviation: '',
                causes: [''],
                consequences: [''],
                safeguards: [''],
                likelihood: '',
                severity: '',
                risk: '',
                recommendations: [{
                  action: '',
                  type: '',
                  priority: '',
                  responsibility: '',
                  targetDate: ''
                }]
              }]
            })}
          >
            Add Node
          </Button>
        </div>

        {/* AI Suggestions Panel */}
        {aiSuggestions && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              AI Suggestions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Deviations</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {aiSuggestions.deviations?.map((item: string, index: number) => (
                    <li key={index} className="cursor-pointer hover:text-blue-600" onClick={() => {
                      // Auto-fill deviation
                        setValue(`nodes.0.worksheets.0.deviation`, item);
                        
                    }}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Causes</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {aiSuggestions.causes?.map((item: string, index: number) => (
                    <li key={index} className="cursor-pointer hover:text-blue-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Consequences</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {aiSuggestions.consequences?.map((item: string, index: number) => (
                    <li key={index} className="cursor-pointer hover:text-blue-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Safeguards</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  {aiSuggestions.safeguards?.map((item: string, index: number) => (
                    <li key={index} className="cursor-pointer hover:text-blue-600">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Confidence: {Math.round((aiSuggestions.confidence || 0) * 100)}%
            </div>
          </Card>
        )}
      </form>
    </div>
  );
};

export default HAZOPWorksheet;