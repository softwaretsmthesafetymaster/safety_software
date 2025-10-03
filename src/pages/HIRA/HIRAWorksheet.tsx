import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Save,
  Plus,
  Trash2,
  Sparkles,
  Send,
  AlertTriangle,
  Download,
  Target,
  Users
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateHIRAWorksheet, completeHIRAAssessment, getAISuggestions } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';

interface WorksheetRow {
  taskName: string;
  activityService: string;
  routineNonRoutine: 'Routine' | 'Non-Routine';
  hazardConcern: string;
  hazardDescription: string;
  likelihood: number;
  consequence: number;
  riskScore: number;
  existingRiskControl: string;
  significantNotSignificant: 'Significant' | 'Not Significant';
  riskCategory: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High';
  recommendation: string;
  actionOwner?: string;
  targetDate?: string;
  remarks?: string;
}

const HIRAWorksheet: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);

  const [worksheetRows, setWorksheetRows] = useState<WorksheetRow[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<any>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  useEffect(() => {
    if (currentAssessment?.worksheetRows) {
      setWorksheetRows(currentAssessment.worksheetRows);
    } else {
      // Initialize with empty row if no data exists
      setWorksheetRows([createEmptyRow()]);
    }
  }, [currentAssessment]);

  const createEmptyRow = (): WorksheetRow => ({
    taskName: '',
    activityService: '',
    routineNonRoutine: 'Routine',
    hazardConcern: '',
    hazardDescription: '',
    likelihood: 1,
    consequence: 1,
    riskScore: 1,
    existingRiskControl: '',
    significantNotSignificant: 'Not Significant',
    riskCategory: 'Very Low',
    recommendation: '',
    actionOwner: '',
    targetDate: '',
    remarks: ''
  });

  const addRow = () => {
    setWorksheetRows([...worksheetRows, createEmptyRow()]);
  };

  const removeRow = (index: number) => {
    if (worksheetRows.length > 1) {
      const updated = worksheetRows.filter((_, i) => i !== index);
      setWorksheetRows(updated);
    }
  };

  const updateRow = (index: number, field: keyof WorksheetRow, value: any) => {
    const updated = [...worksheetRows];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate risk score and category
    if (field === 'likelihood' || field === 'consequence') {
      const likelihood = field === 'likelihood' ? parseInt(value) : updated[index].likelihood;
      const consequence = field === 'consequence' ? parseInt(value) : updated[index].consequence;
      updated[index].riskScore = likelihood * consequence;
      
      // Determine risk category
      const score = updated[index].riskScore;
      if (score <= 4) updated[index].riskCategory = 'Very Low';
      else if (score <= 8) updated[index].riskCategory = 'Low';
      else if (score <= 12) updated[index].riskCategory = 'Moderate';
      else if (score <= 20) updated[index].riskCategory = 'High';
      else updated[index].riskCategory = 'Very High';

      // Auto-set significance for high risk items
      if (score > 12) {
        updated[index].significantNotSignificant = 'Significant';
      }
    }
    
    setWorksheetRows(updated);
  };

  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'Very High':
        return 'bg-red-600 text-white';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getAIAssistance = async (rowIndex: number) => {
    const row = worksheetRows[rowIndex];
    if (!row.taskName || !row.activityService) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please fill in Task Name and Activity/Service first'
      }));
      return;
    }

    try {
      const result = await dispatch(getAISuggestions({
        companyId: user?.companyId!,
        id: id!,
        taskName: row.taskName,
        activityService: row.activityService,
        existingHazards: worksheetRows.map(r => r.hazardConcern).filter(Boolean)
      })).unwrap();
      
      setAISuggestions(result.suggestions);
      setSelectedRowIndex(rowIndex);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to get AI suggestions'
      }));
    }
  };

  const applySuggestion = (field: string, suggestion: string) => {
    if (selectedRowIndex !== null) {
      updateRow(selectedRowIndex, field as keyof WorksheetRow, suggestion);
    }
  };

  const saveWorksheet = async () => {
    try {
      await dispatch(updateHIRAWorksheet({
        companyId: user?.companyId!,
        id: id!,
        worksheetRows
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Worksheet saved successfully'
      }));
      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to save worksheet'
      }));
    }
  };

  const completeAssessment = async () => {
    const incompleteRows = worksheetRows.filter(row => 
      !row.taskName || !row.activityService || !row.hazardConcern || !row.hazardDescription || !row.recommendation
    );

    if (incompleteRows.length > 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please complete all required fields before submitting'
      }));
      return;
    }

    try {
      await dispatch(completeHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        worksheetRows
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Assessment completed and sent for approval'
      }));
      
      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to complete assessment'
      }));
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
            icon={Save}
            onClick={saveWorksheet}
            loading={isLoading}
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={completeAssessment}
            disabled={worksheetRows.length === 0 || worksheetRows.some(row => !row.taskName)}
          >
            Complete & Submit
          </Button>
        </div>
      </div>

      {/* Worksheet Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Risk Assessment Worksheet
          </h2>
          <Button
            variant="primary"
            icon={Plus}
            size="sm"
            onClick={addRow}
          >
            Add Row
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                  Task Name *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                  Activity/Service *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                  R/NR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                  Hazard/Concern *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-40">
                  Hazard Description *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-20">
                  Likelihood
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                  Consequence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-20">
                  Risk Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                  Existing Risk Control *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-20">
                  S/NS
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                  Risk Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-40">
                  Recommendation *
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {worksheetRows.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.taskName}
                      onChange={(e) => updateRow(index, 'taskName', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Task name"
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.activityService}
                      onChange={(e) => updateRow(index, 'activityService', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Activity/Service"
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.routineNonRoutine}
                      onChange={(e) => updateRow(index, 'routineNonRoutine', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Routine">R</option>
                      <option value="Non-Routine">NR</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.hazardConcern}
                      onChange={(e) => updateRow(index, 'hazardConcern', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Hazard/Concern"
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={row.hazardDescription}
                      onChange={(e) => updateRow(index, 'hazardDescription', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Detailed description"
                      rows={2}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.likelihood}
                      onChange={(e) => updateRow(index, 'likelihood', parseInt(e.target.value))}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>1 - Rare</option>
                      <option value={2}>2 - Unlikely</option>
                      <option value={3}>3 - Possible</option>
                      <option value={4}>4 - Likely</option>
                      <option value={5}>5 - Almost Certain</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.consequence}
                      onChange={(e) => updateRow(index, 'consequence', parseInt(e.target.value))}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value={1}>1 - Insignificant</option>
                      <option value={2}>2 - Minor</option>
                      <option value={3}>3 - Moderate</option>
                      <option value={4}>4 - Major</option>
                      <option value={5}>5 - Catastrophic</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`px-2 py-1 text-xs font-medium rounded text-center ${getRiskCategoryColor(row.riskCategory)}`}>
                      {row.riskScore}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={row.existingRiskControl}
                      onChange={(e) => updateRow(index, 'existingRiskControl', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Current controls"
                      rows={2}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.significantNotSignificant}
                      onChange={(e) => updateRow(index, 'significantNotSignificant', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Significant">S</option>
                      <option value="Not Significant">NS</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getRiskCategoryColor(row.riskCategory)}`}>
                      {row.riskCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={row.recommendation}
                      onChange={(e) => updateRow(index, 'recommendation', e.target.value)}
                      className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Safety recommendations"
                      rows={2}
                      required
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Sparkles}
                        onClick={() => getAIAssistance(index)}
                        title="Get AI suggestions"
                        className="text-purple-600 hover:text-purple-700"
                      />
                      {worksheetRows.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Trash2}
                          onClick={() => removeRow(index)}
                          className="text-red-600 hover:text-red-700"
                          title="Remove row"
                        />
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {worksheetRows.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No worksheet entries
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by adding your first task to the worksheet.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                icon={Plus}
                onClick={addRow}
              >
                Add First Row
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* AI Suggestions Panel */}
      {aiSuggestions && selectedRowIndex !== null && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                AI Safety Suggestions
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAISuggestions(null)}
              >
                Close
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                  Potential Hazards
                </h4>
                <div className="space-y-2">
                  {aiSuggestions.hazards?.map((hazard: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => applySuggestion('hazardConcern', hazard)}
                      className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900 dark:hover:bg-red-800 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                    >
                      {hazard}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-1 text-blue-500" />
                  Risk Controls
                </h4>
                <div className="space-y-2">
                  {aiSuggestions.controls?.map((control: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => applySuggestion('existingRiskControl', control)}
                      className="block w-full text-left p-3 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors"
                    >
                      {control}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-1 text-green-500" />
                  Recommendations
                </h4>
                <div className="space-y-2">
                  {aiSuggestions.recommendations?.map((rec: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => applySuggestion('recommendation', rec)}
                      className="block w-full text-left p-3 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800 rounded-lg border border-green-200 dark:border-green-700 transition-colors"
                    >
                      {rec}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                AI Confidence: {Math.round((aiSuggestions.confidence || 0) * 100)}%
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Summary Statistics */}
      {worksheetRows.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Risk Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {worksheetRows.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {worksheetRows.filter(row => ['Very High', 'High'].includes(row.riskCategory)).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {worksheetRows.filter(row => row.riskCategory === 'Moderate').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Moderate Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {worksheetRows.filter(row => ['Low', 'Very Low'].includes(row.riskCategory)).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {worksheetRows.filter(row => row.significantNotSignificant === 'Significant').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Significant</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default HIRAWorksheet;