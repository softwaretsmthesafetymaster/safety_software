import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Sparkles, Send, AlertTriangle, Download, Target, Users, Eye, EyeOff, Copy, CreditCard as Edit3, Check, X, RefreshCw, FileText, Zap, Shield, Filter, Search } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateHIRAWorksheet, completeHIRAAssessment, getAISuggestions } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import toast from 'react-hot-toast';

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
  const [previewMode, setPreviewMode] = useState(false);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  
  

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveEnabled && worksheetRows.length > 0) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [worksheetRows, autoSaveEnabled]);

  useEffect(() => {
    if (currentAssessment?.worksheetRows) {
      setWorksheetRows(currentAssessment.worksheetRows);
    } else {
      setWorksheetRows([createEmptyRow()]);
    }
  }, [currentAssessment]);

  const createEmptyRow = useCallback((): WorksheetRow => ({
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
  }), []);

  const addRow = useCallback(() => {
    setWorksheetRows(prev => [...prev, createEmptyRow()]);
  }, [createEmptyRow]);

  const addMultipleRows = useCallback((count: number) => {
    const newRows = Array(count).fill(null).map(() => createEmptyRow());
    setWorksheetRows(prev => [...prev, ...newRows]);
  }, [createEmptyRow]);

  const removeRow = useCallback((index: number) => {
    if (worksheetRows.length > 1) {
      setWorksheetRows(prev => prev.filter((_, i) => i !== index));
      if (selectedRows.has(index)) {
        const newSelected = new Set(selectedRows);
        newSelected.delete(index);
        setSelectedRows(newSelected);
      }
    }
  }, [worksheetRows.length, selectedRows]);

  const duplicateRow = useCallback((index: number) => {
    const rowToDuplicate = { ...worksheetRows[index] };
    rowToDuplicate.taskName = `${rowToDuplicate.taskName} (Copy)`;
    setWorksheetRows(prev => {
      const newRows = [...prev];
      newRows.splice(index + 1, 0, rowToDuplicate);
      return newRows;
    });
  }, [worksheetRows]);

  const updateRow = useCallback((index: number, field: keyof WorksheetRow, value: any) => {
    setWorksheetRows(prev => {
      const updated = [...prev];
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

      return updated;
    });
  }, []);

  const bulkUpdate = useCallback((field: keyof WorksheetRow, value: any) => {
    if (selectedRows.size === 0) return;

    setWorksheetRows(prev => {
      const updated = [...prev];
      selectedRows.forEach(index => {
        updated[index] = { ...updated[index], [field]: value };
      });
      return updated;
    });
  }, [selectedRows]);

  const getRiskCategoryColor = useCallback((category: string) => {
    switch (category) {
      case 'Very High':
        return 'bg-red-600 text-white border-red-600';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      case 'Moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      case 'Low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300';
    }
  }, []);

  const getAIAssistance = async (rowIndex: number) => {
    const row = worksheetRows[rowIndex];
    if (!row.taskName || !row.activityService) {
      toast.error('Please fill in Task Name and Activity/Service first');
      return;
    }

    try {
      setLoading(true);
      toast.loading('Loading...');
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
      toast.error('Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const applyAISuggestion = (field: string, suggestion: string) => {
    if (selectedRowIndex !== null) {
      if (field === 'hazardConcern' && suggestion.includes('|')) {
        // Handle multiple suggestions
        const suggestions = suggestion.split('|').map(s => s.trim());
        updateRow(selectedRowIndex, field as keyof WorksheetRow, suggestions[0]);
        // Add additional rows for other suggestions
        suggestions.slice(1).forEach(() => {
          const newRow = { ...worksheetRows[selectedRowIndex] };
          newRow.hazardConcern = suggestions[suggestions.indexOf(suggestion)];
          setWorksheetRows(prev => [...prev, newRow]);
        });
      } else {
        updateRow(selectedRowIndex, field as keyof WorksheetRow, suggestion);
      }
    }
  };

  const applyAllAISuggestions = () => {
    if (selectedRowIndex !== null && aiSuggestions) {
      // Apply first suggestion from each category
      if (aiSuggestions.hazards?.length > 0) {
        updateRow(selectedRowIndex, 'hazardConcern', aiSuggestions.hazards[0]);
      }
      if (aiSuggestions.description?.length > 0) {
        updateRow(selectedRowIndex, 'hazardDescription', aiSuggestions.description[0]);
      }
      if (aiSuggestions.likelihood?.length > 0) {
        updateRow(selectedRowIndex, 'likelihood', aiSuggestions.likelihood[0]);
      }
      if (aiSuggestions.consequence?.length > 0) {
        updateRow(selectedRowIndex, 'consequence', aiSuggestions.consequence[0]);
      }
      if (aiSuggestions.significant?.length > 0) {
        updateRow(selectedRowIndex, 'significantNotSignificant', aiSuggestions.significant[0]);
      }
      if (aiSuggestions.controls?.length > 0) {
        updateRow(selectedRowIndex, 'existingRiskControl', aiSuggestions.controls[0]);
      }
      if (aiSuggestions.recommendations?.length > 0) {
        updateRow(selectedRowIndex, 'recommendation', aiSuggestions.recommendations[0]);
      }
      
      setAISuggestions(null);
      setSelectedRowIndex(null);
      setLoading(false);
      
      toast.success('AI suggestions applied successfully');
    }
  };

  const handleAutoSave = async () => {
    try {
      await dispatch(updateHIRAWorksheet({
        companyId: user?.companyId,
        id: id,
        worksheetRows
      })).unwrap();
    } catch (error) {
      // Silent fail for auto-save
    }
  };

  const saveWorksheet = async () => {
    try {
      await dispatch(updateHIRAWorksheet({
        companyId: user?.companyId,
        id: id,
        worksheetRows
      })).unwrap();

      toast.success('Worksheet saved successfully');
      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      toast.error('Failed to save worksheet');
    }
  };

  const completeAssessment = async () => {
    const incompleteRows = worksheetRows.filter(row =>
      !row.taskName || !row.activityService || !row.hazardConcern || !row.hazardDescription || !row.recommendation
    );

    if (incompleteRows.length > 0) {
      toast.error('Please complete all required fields before submitting');
      return;
    }

    try {
      await dispatch(completeHIRAAssessment({
        companyId: user?.companyId!,
        id: id!,
        worksheetRows
      })).unwrap();

      toast.success('Assessment completed and sent for approval');

      navigate(`/hira/assessments/${id}`);
    } catch (error: any) {
      toast.error('Failed to complete assessment');
    }
  };

  // Filter and search functionality
  const filteredRows = useMemo(() => {
    return worksheetRows.filter((row, index) => {
      const matchesSearch = searchTerm === '' || 
        row.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.hazardConcern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.recommendation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRisk = filterRisk === 'all' || row.riskCategory === filterRisk;

      return matchesSearch && matchesRisk;
    }).map((row, originalIndex) => ({
      row,
      originalIndex: worksheetRows.indexOf(row)
    }));
  }, [worksheetRows, searchTerm, filterRisk]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = worksheetRows.length;
    const highRisk = worksheetRows.filter(row => ['Very High', 'High'].includes(row.riskCategory)).length;
    const moderate = worksheetRows.filter(row => row.riskCategory === 'Moderate').length;
    const low = worksheetRows.filter(row => ['Low', 'Very Low'].includes(row.riskCategory)).length;
    const significant = worksheetRows.filter(row => row.significantNotSignificant === 'Significant').length;
    const completed = worksheetRows.filter(row => row.taskName && row.hazardConcern && row.recommendation).length;

    return { total, highRisk, moderate, low, significant, completed };
  }, [worksheetRows]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  HIRA Worksheet
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{summary.completed}/{summary.total} completed</span>
                  <span>•</span>
                  <span className="flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Auto-save {autoSaveEnabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
              <button
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  !previewMode
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="h-4 w-4 inline mr-2" />
                Edit
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  previewMode
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Preview
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                icon={Save}
                onClick={saveWorksheet}
                loading={isLoading}
                size="sm"
              >
                Save Draft
              </Button>
              <Button
                variant="primary"
                icon={Send}
                onClick={completeAssessment}
                disabled={worksheetRows.length === 0 || summary.completed < summary.total}
                size="sm"
              >
                Submit
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{summary.highRisk}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Risk</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.moderate}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Moderate</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{summary.low}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Low Risk</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{summary.significant}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Significant</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{summary.completed}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks, hazards..."
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
              >
                <option value="all">All Risk Levels</option>
                <option value="Very High">Very High</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
                <option value="Very Low">Very Low</option>
              </select>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  icon={Plus}
                  onClick={addRow}
                  size="sm"
                >
                  Add Row
                </Button>
                <Button
                  variant="ghost"
                  icon={Copy}
                  onClick={() => addMultipleRows(5)}
                  size="sm"
                >
                  Add 5
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={bulkEditMode ? "primary" : "ghost"}
                  icon={Users}
                  onClick={() => setBulkEditMode(!bulkEditMode)}
                  size="sm"
                >
                  Bulk Edit
                </Button>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span>Auto-save</span>
                </label>
              </div>
            </div>

            {/* Bulk Edit Controls */}
            <AnimatePresence>
              {bulkEditMode && selectedRows.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedRows.size} rows selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRows(new Set())}
                    >
                      Clear Selection
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      onChange={(e) => bulkUpdate('routineNonRoutine', e.target.value)}
                      className="text-sm rounded-md border-gray-300 dark:border-gray-600"
                    >
                      <option value="">Set R/NR...</option>
                      <option value="Routine">Routine</option>
                      <option value="Non-Routine">Non-Routine</option>
                    </select>
                    <select
                      onChange={(e) => bulkUpdate('significantNotSignificant', e.target.value)}
                      className="text-sm rounded-md border-gray-300 dark:border-gray-600"
                    >
                      <option value="">Set Significance...</option>
                      <option value="Significant">Significant</option>
                      <option value="Not Significant">Not Significant</option>
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      icon={Trash2}
                      onClick={() => {
                        selectedRows.forEach(index => removeRow(index));
                        setSelectedRows(new Set());
                      }}
                    >
                      Delete Selected
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Worksheet Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Risk Assessment Worksheet ({filteredRows.length} rows)
              </h2>
              <div className="flex items-center space-x-2">
                
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {bulkEditMode && (
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedRows.size === filteredRows.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(new Set(filteredRows.map((_, i) => i)));
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-40">
                      Task Name *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-40">
                      Activity/Service *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                      R/NR
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-40">
                      Hazard/Concern *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-48">
                      Hazard Description *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-28">
                      Likelihood
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                      Consequence
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-24">
                      Risk Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-48">
                      Existing Risk Control *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-20">
                      S/NS
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-28">
                      Risk Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-48">
                      Recommendation *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRows.map(({ row, originalIndex }, displayIndex) => (
                    <motion.tr
                      key={originalIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: displayIndex * 0.02 }}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedRows.has(originalIndex) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      {bulkEditMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRows.has(originalIndex)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedRows);
                              if (e.target.checked) {
                                newSelected.add(originalIndex);
                              } else {
                                newSelected.delete(originalIndex);
                              }
                              setSelectedRows(newSelected);
                            }}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </td>
                      )}

                      {/* Task Name */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {row.taskName || '-'}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.taskName}
                            onChange={(e) => updateRow(originalIndex, 'taskName', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Enter task name"
                            required
                          />
                        )}
                      </td>

                      {/* Activity/Service */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {row.activityService || '-'}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.activityService}
                            onChange={(e) => updateRow(originalIndex, 'activityService', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Enter activity"
                            required
                          />
                        )}
                      </td>

                      {/* R/NR */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            row.routineNonRoutine === 'Routine'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {row.routineNonRoutine === 'Routine' ? 'R' : 'NR'}
                          </span>
                        ) : (
                          <select
                            value={row.routineNonRoutine}
                            onChange={(e) => updateRow(originalIndex, 'routineNonRoutine', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            <option value="Routine">Routine</option>
                            <option value="Non-Routine">Non-Routine</option>
                          </select>
                        )}
                      </td>

                      {/* Hazard/Concern */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {row.hazardConcern || '-'}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={row.hazardConcern}
                            onChange={(e) => updateRow(originalIndex, 'hazardConcern', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Identify hazard"
                            required
                          />
                        )}
                      </td>

                      {/* Hazard Description */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm text-gray-900 dark:text-white max-w-48 truncate">
                            {row.hazardDescription || '-'}
                          </div>
                        ) : (
                          <textarea
                            value={row.hazardDescription}
                            onChange={(e) => updateRow(originalIndex, 'hazardDescription', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Describe hazard details"
                            rows={2}
                            required
                          />
                        )}
                      </td>

                      {/* Likelihood */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${
                            row.likelihood >= 4 ? 'bg-red-100 text-red-800 border-red-200' :
                            row.likelihood >= 3 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {row.likelihood}
                          </span>
                        ) : (
                          <select
                            value={row.likelihood}
                            onChange={(e) => updateRow(originalIndex, 'likelihood', parseInt(e.target.value))}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            <option value={1}>1 - Rare</option>
                            <option value={2}>2 - Unlikely</option>
                            <option value={3}>3 - Possible</option>
                            <option value={4}>4 - Likely</option>
                            <option value={5}>5 - Almost Certain</option>
                          </select>
                        )}
                      </td>

                      {/* Consequence */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${
                            row.consequence >= 4 ? 'bg-red-100 text-red-800 border-red-200' :
                            row.consequence >= 3 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {row.consequence}
                          </span>
                        ) : (
                          <select
                            value={row.consequence}
                            onChange={(e) => updateRow(originalIndex, 'consequence', parseInt(e.target.value))}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            <option value={1}>1 - Insignificant</option>
                            <option value={2}>2 - Minor</option>
                            <option value={3}>3 - Moderate</option>
                            <option value={4}>4 - Major</option>
                            <option value={5}>5 - Catastrophic</option>
                          </select>
                        )}
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3">
                        <div className={`px-2 py-1 text-xs font-medium rounded text-center border ${getRiskCategoryColor(row.riskCategory)}`}>
                          {row.riskScore}
                        </div>
                      </td>

                      {/* Existing Risk Control */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm text-gray-900 dark:text-white max-w-48 truncate">
                            {row.existingRiskControl || '-'}
                          </div>
                        ) : (
                          <textarea
                            value={row.existingRiskControl}
                            onChange={(e) => updateRow(originalIndex, 'existingRiskControl', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Current control measures"
                            rows={2}
                            required
                          />
                        )}
                      </td>

                      {/* S/NS */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            row.significantNotSignificant === 'Significant'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {row.significantNotSignificant === 'Significant' ? 'S' : 'NS'}
                          </span>
                        ) : (
                          <select
                            value={row.significantNotSignificant}
                            onChange={(e) => updateRow(originalIndex, 'significantNotSignificant', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          >
                            <option value="Significant">Significant</option>
                            <option value="Not Significant">Not Significant</option>
                          </select>
                        )}
                      </td>

                      {/* Risk Category */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskCategoryColor(row.riskCategory)}`}>
                          {row.riskCategory}
                        </span>
                      </td>

                      {/* Recommendation */}
                      <td className="px-4 py-3">
                        {previewMode ? (
                          <div className="text-sm text-gray-900 dark:text-white max-w-48 truncate">
                            {row.recommendation || '-'}
                          </div>
                        ) : (
                          <textarea
                            value={row.recommendation}
                            onChange={(e) => updateRow(originalIndex, 'recommendation', e.target.value)}
                            className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                            placeholder="Safety recommendations"
                            rows={2}
                            required
                          />
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Sparkles}
                            onClick={() => getAIAssistance(originalIndex)}
                            title="Get AI suggestions"
                            className="text-purple-600 hover:text-purple-700"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Copy}
                            onClick={() => duplicateRow(originalIndex)}
                            title="Duplicate row"
                            className="text-blue-600 hover:text-blue-700"
                          />
                          {worksheetRows.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={Trash2}
                              onClick={() => removeRow(originalIndex)}
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

            {filteredRows.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No worksheet entries found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || filterRisk !== 'all'
                    ? "No entries match your current filters."
                    : "Get started by adding your first task to the worksheet."}
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
        </motion.div>

        {/* AI Suggestions Panel */}
        <AnimatePresence>
          {aiSuggestions && selectedRowIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <Card className="p-6 border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                    <Zap className="h-6 w-6 mr-2 text-purple-600" />
                    AI Safety Suggestions
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={applyAllAISuggestions}
                    >
                      Apply All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={() => {
                        setAISuggestions(null);
                        setSelectedRowIndex(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Hazards */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Potential Hazards ({aiSuggestions.hazards?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions?.hazards?.map((hazard: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('hazardConcern', hazard)}
                          className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                        >
                          {hazard}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Description */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Description ({aiSuggestions.description?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions?.description?.map((description: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('hazardDescription', description)}
                          className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                        >
                          {description}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Likelihood */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Likelihood ({aiSuggestions.likelihood?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions?.likelihood?.map((likelihood: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('likelihood', likelihood)}
                          className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                        >
                          {likelihood}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Consequences */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Consequences ({aiSuggestions.consequence?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions?.consequence?.map((consequence: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('consequence', consequence)}
                          className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                        >
                          {consequence}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {/* Significant */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                      Significant ({aiSuggestions.significant?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions?.significant?.map((significant: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('significant', significant)}
                          className="block w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
                        >
                          {significant}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Controls */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Shield className="h-4 w-4 mr-1 text-blue-500" />
                      Risk Controls ({aiSuggestions.controls?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions.controls?.map((control: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('existingRiskControl', control)}
                          className="block w-full text-left p-3 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors"
                        >
                          {control}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                      <Target className="h-4 w-4 mr-1 text-green-500" />
                      Recommendations ({aiSuggestions.recommendations?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiSuggestions.recommendations?.map((rec: string, idx: number) => (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => applyAISuggestion('recommendation', rec)}
                          className="block w-full text-left p-3 text-sm bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 transition-colors"
                        >
                          {rec}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-purple-500" />
                      <span>AI Confidence: {Math.round((aiSuggestions.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span>Generated just now</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HIRAWorksheet;