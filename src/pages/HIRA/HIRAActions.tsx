import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, User, Calendar, CheckCircle, Clock, AlertCircle, Save, Send, FileText, Users, Filter, Search, Upload, MessageSquare, Download, RefreshCw, Bell, TrendingUp, Activity, Eye, CreditCard as Edit3, Camera, Paperclip, MapPin, Star, AlertTriangle, Timer, UserCheck, BarChart3 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import {
  updateHIRAActions,
  fetchHIRAById,
  assignActions,
  completeAllActions
} from '../../store/slices/hiraSlice';
import { fetchUsers } from '../../store/slices/userSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { format, isAfter, differenceInDays } from 'date-fns';

interface ActionItem {
  id: number;
  originalIndex: number;
  taskName: string;
  hazardConcern: string;
  riskCategory: string;
  riskScore: number;
  recommendation: string;
  actionOwner: string;
  targetDate: string;
  actionStatus: 'Open' | 'In Progress' | 'Completed';
  remarks: string;
  completionEvidence: string;
  actualCompletionDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  estimatedEffort: number;
}

const HIRAActions: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { users } = useAppSelector((state) => state.user);

  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [completionModal, setCompletionModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'status' | 'risk'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [completionData, setCompletionData] = useState({
    remarks: '',
    completionEvidence: '',
    actualCompletionDate: new Date().toISOString().split('T')[0],
    photos: [] as string[],
    documents: [] as string[]
  });

  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkAssignData, setBulkAssignData] = useState({
    owner: '',
    targetDate: '',
    selectedActions: new Set<number>()
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
      dispatch(fetchUsers({ plantId: user.plantId?._id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment?.worksheetRows) {
      const actionItems = currentAssessment.worksheetRows
        .filter(row => row.recommendation && row.recommendation.trim() !== '')
        .map((row, index) => ({
          id: index,
          originalIndex: currentAssessment.worksheetRows.indexOf(row),
          taskName: row.taskName,
          hazardConcern: row.hazardConcern,
          riskCategory: row.riskCategory,
          riskScore: row.riskScore,
          recommendation: row.recommendation,
          actionOwner: row.actionOwner || '',
          targetDate: row.targetDate || '',
          actionStatus: row.actionStatus || 'Open',
          remarks: row.remarks || '',
          completionEvidence: row.completionEvidence || '',
          actualCompletionDate: row.actualCompletionDate || '',
          priority: determinePriority(row.riskCategory, row.riskScore),
          estimatedEffort: estimateEffort(row.recommendation)
        })) as ActionItem[];
      setActions(actionItems);
    }
  }, [currentAssessment]);

  const determinePriority = (riskCategory: string, riskScore: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
    if (riskCategory === 'Very High' || riskScore >= 20) return 'Critical';
    if (riskCategory === 'High' || riskScore >= 15) return 'High';
    if (riskCategory === 'Moderate' || riskScore >= 9) return 'Medium';
    return 'Low';
  };

  const estimateEffort = (recommendation: string): number => {
    const complexity = recommendation.length > 200 ? 3 : recommendation.length > 100 ? 2 : 1;
    return complexity * 2; // Base effort in days
  };

  const updateAction = useCallback((index: number, field: keyof ActionItem, value: any) => {
    setActions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const saveActions = async () => {
    try {
      const updatedWorksheetRows = [...(currentAssessment?.worksheetRows || [])];

      actions.forEach(action => {
        const originalIndex = action.originalIndex;
        if (originalIndex !== undefined && updatedWorksheetRows[originalIndex]) {
          updatedWorksheetRows[originalIndex] = {
            ...updatedWorksheetRows[originalIndex],
            actionOwner: action.actionOwner,
            targetDate: action.targetDate,
            actionStatus: action.actionStatus,
            remarks: action.remarks,
            completionEvidence: action.completionEvidence,
            actualCompletionDate: action.actualCompletionDate
          };
        }
      });

      await dispatch(assignActions({
        companyId: user?.companyId!,
        id: id!,
        worksheetRows: updatedWorksheetRows
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Action items assigned successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to assign action items'
      }));
    }
  };

  const completeAction = async (actionIndex: number) => {
    try {
      await dispatch(updateHIRAActions({
        companyId: user?.companyId!,
        id: id!,
        actionIndex,
        data: {
          actionStatus: 'Completed',
          ...completionData
        }
      })).unwrap();

      const updated = [...actions];
      updated[actionIndex] = {
        ...updated[actionIndex],
        actionStatus: 'Completed',
        ...completionData
      };
      setActions(updated);

      dispatch(addNotification({
        type: 'success',
        message: 'Action completed successfully'
      }));

      setCompletionModal(false);
      setSelectedAction(null);
      setCompletionData({
        remarks: '',
        completionEvidence: '',
        actualCompletionDate: new Date().toISOString().split('T')[0],
        photos: [],
        documents: []
      });
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to complete action'
      }));
    }
  };

  const bulkAssignActions = () => {
    if (bulkAssignData.selectedActions.size === 0) {
      dispatch(addNotification({
        type: 'warning',
        message: 'Please select actions to assign'
      }));
      return;
    }

    const updated = [...actions];
    bulkAssignData.selectedActions.forEach(index => {
      updated[index] = {
        ...updated[index],
        actionOwner: bulkAssignData.owner,
        targetDate: bulkAssignData.targetDate
      };
    });

    setActions(updated);
    setBulkAssignModal(false);
    setBulkAssignData({
      owner: '',
      targetDate: '',
      selectedActions: new Set()
    });

    dispatch(addNotification({
      type: 'success',
      message: `${bulkAssignData.selectedActions.size} actions assigned successfully`
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'In Progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-600 text-white border-red-600';
      case 'High':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300';
    }
  };

  const getRiskColor = (category: string) => {
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

  const isOverdue = (targetDate: string, status: string) => {
    if (!targetDate || status === 'Completed') return false;
    return isAfter(new Date(), new Date(targetDate));
  };

  const getDaysRemaining = (targetDate: string, status: string) => {
    if (!targetDate || status === 'Completed') return null;
    const days = differenceInDays(new Date(targetDate), new Date());
    return days;
  };

  const filteredAndSortedActions = useMemo(() => {
    let filtered = actions.filter(action => {
      const matchesStatus = !filterStatus || action.actionStatus === filterStatus;
      const matchesPriority = !filterPriority || action.priority === filterPriority;
      const matchesOwner = !filterOwner || action.actionOwner === filterOwner;
      const matchesSearch = !searchTerm ||
        action.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.hazardConcern.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.recommendation.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesPriority && matchesOwner && matchesSearch;
    });

    // Sort actions
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'dueDate':
          aValue = a.targetDate ? new Date(a.targetDate).getTime() : 0;
          bValue = b.targetDate ? new Date(b.targetDate).getTime() : 0;
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          const statusOrder = { 'Open': 1, 'In Progress': 2, 'Completed': 3 };
          aValue = statusOrder[a.actionStatus];
          bValue = statusOrder[b.actionStatus];
          break;
        case 'risk':
          aValue = a.riskScore;
          bValue = b.riskScore;
          break;
        default:
          return 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [actions, filterStatus, filterPriority, filterOwner, searchTerm, sortBy, sortOrder]);
  const actionSummary = useMemo(() => {
    const overdue = actions.filter(a => isOverdue(a.targetDate, a.actionStatus)).length;
    const open = actions.filter(a => a.actionStatus === 'Open').length;
    const inProgress = actions.filter(a => a.actionStatus === 'In Progress').length;
    const completed = actions.filter(a => a.actionStatus === 'Completed').length;
    const critical = actions.filter(a => a.priority === 'Critical').length;
    const high = actions.filter(a => a.priority === 'High').length;
    const total = actions.length;

    return {
      overdue,
      open,
      inProgress,
      completed,
      critical,
      high,
      total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [actions]);

  const canManageActions = () => {
    return currentAssessment?.createdBy === user?._id || user?.role === 'superadmin' || currentAssessment?.assessor._id === user?._id ||
           currentAssessment?.team?.some((member: any) => member._id === user?._id);
  };

  const canCompleteAction = (action: ActionItem) => {
    return action.actionOwner?._id === user?._id ;
  };

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
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  HIRA Action Items
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{actionSummary.completed}/{actionSummary.total} completed</span>
                  <span>•</span>
                  <span>{actionSummary.overdue} overdue</span>
                  <span>•</span>
                  <span>{actionSummary.completionRate}% completion rate</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Eye className="h-4 w-4 inline mr-2" />
                Cards
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-2" />
                Kanban
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {canManageActions() && currentAssessment?.status === 'approved' && (
                <>
                  <Button
                    variant="secondary"
                    icon={Users}
                    onClick={() => setBulkAssignModal(true)}
                    size="sm"
                  >
                    Bulk Assign
                  </Button>
                  <Button
                    variant="primary"
                    icon={Save}
                    onClick={saveActions}
                    loading={isLoading}
                    size="sm"
                  >
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <Card className="p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-900 dark:text-red-100 text-sm">Overdue</h3>
                <p className="text-3xl font-bold text-red-600">{actionSummary.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-orange-900 dark:text-orange-100 text-sm">Critical</h3>
                <p className="text-3xl font-bold text-orange-600">{actionSummary.critical}</p>
              </div>
              <Star className="h-8 w-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">Open</h3>
                <p className="text-3xl font-bold text-yellow-600">{actionSummary.open}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">In Progress</h3>
                <p className="text-3xl font-bold text-blue-600">{actionSummary.inProgress}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-900 dark:text-green-100 text-sm">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{actionSummary.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-purple-900 dark:text-purple-100 text-sm">Completion</h3>
                <p className="text-3xl font-bold text-purple-600">{actionSummary.completionRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </Card>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search actions..."
                  className="pl-10 w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>

              <select
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
              >
                <option value="">All Owners</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>

              <select
                className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
                <option value="risk">Sort by Risk Level</option>
              </select>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
                <Button
                  variant="ghost"
                  icon={Filter}
                  onClick={() => {
                    setFilterStatus('');
                    setFilterPriority('');
                    setFilterOwner('');
                    setSearchTerm('');
                  }}
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Action Items Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {viewMode === 'table' && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Action Items Management ({filteredAndSortedActions.length} items)
                </h2>
                
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Task & Hazard
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Risk Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recommendation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAndSortedActions.map((action, index) => {
                      const daysRemaining = getDaysRemaining(action.targetDate, action.actionStatus);
                      const overdue = isOverdue(action.targetDate, action.actionStatus);

                      return (
                        <motion.tr
                          key={action.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            overdue ? 'bg-red-50 dark:bg-red-900/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {action.taskName}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                {action.hazardConcern}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(action.riskCategory)}`}>
                              {action.riskCategory} ({action.riskScore})
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                              {action.recommendation}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Est. {action.estimatedEffort} days
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {canManageActions() && currentAssessment?.status === 'approved' ? (
                              <select
                                value={action.actionOwner}
                                onChange={(e) => updateAction(actions.indexOf(action), 'actionOwner', e.target.value)}
                                className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white min-w-0"
                              >
                                <option value="">Select Owner</option>
                                {users.map((u) => (
                                  <option key={u._id} value={u._id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <UserCheck className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {users.find(u => u._id === action.actionOwner?._id)?.name || 'Not assigned'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {canManageActions() && currentAssessment?.status === 'approved' ? (
                              <input
                                type="date"
                                value={action.targetDate}
                                onChange={(e) => updateAction(actions.indexOf(action), 'targetDate', e.target.value)}
                                className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white w-full"
                              />
                            ) : (
                              <div>
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {action.targetDate ? format(new Date(action.targetDate), 'MMM dd, yyyy') : 'Not set'}
                                </div>
                                {daysRemaining !== null && (
                                  <div className={`text-xs ${
                                    overdue ? 'text-red-600' : daysRemaining <= 3 ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                    {overdue ? `${Math.abs(daysRemaining)} days overdue` : 
                                     daysRemaining === 0 ? 'Due today' :
                                     `${daysRemaining} days left`}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${getStatusColor(action.actionStatus)}`}>
                                {getStatusIcon(action.actionStatus)}
                                <span className="ml-1">{action.actionStatus}</span>
                              </span>
                              {overdue && (
                                <span className="inline-flex items-center px-1 py-1 rounded text-xs text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {canCompleteAction(action) && action.actionStatus !== 'Completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => {
                                    setSelectedAction(action);
                                    setCompletionModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Complete
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={MessageSquare}
                                onClick={() => {
                                  // Open comments modal
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              />
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAndSortedActions.length === 0 && (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No action items found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {actions.length === 0
                      ? "Complete the worksheet to generate action items from recommendations."
                      : "No actions match your current filters."}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedActions.map((action, index) => {
                const daysRemaining = getDaysRemaining(action.targetDate, action.actionStatus);
                const overdue = isOverdue(action.targetDate, action.actionStatus);

                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-6 h-full border-l-4 ${
                      overdue ? 'border-red-500' : 
                      action.priority === 'Critical' ? 'border-red-500' :
                      action.priority === 'High' ? 'border-orange-500' :
                      action.priority === 'Medium' ? 'border-yellow-500' :
                      'border-green-500'
                    }`}>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                              {action.taskName}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {action.hazardConcern}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                          </div>
                        </div>

                        {/* Risk and Status */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(action.riskCategory)}`}>
                            {action.riskCategory} ({action.riskScore})
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(action.actionStatus)}`}>
                            {action.actionStatus}
                          </span>
                        </div>

                        {/* Recommendation */}
                        <div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {action.recommendation}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Est. {action.estimatedEffort} days
                          </p>
                        </div>

                        {/* Owner and Due Date */}
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {users.find(u => u._id === action.actionOwner?._id)?.name || 'Not assigned'}
                            </span>
                          </div>
                          {action.targetDate && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className={`text-sm ${
                                overdue ? 'text-red-600' : 
                                daysRemaining !== null && daysRemaining <= 3 ? 'text-yellow-600' : 
                                'text-gray-700 dark:text-gray-300'
                              }`}>
                                {format(new Date(action.targetDate), 'MMM dd, yyyy')}
                                {daysRemaining !== null && (
                                  <span className="ml-1 text-xs">
                                    ({overdue ? `${Math.abs(daysRemaining)} days overdue` : 
                                      daysRemaining === 0 ? 'Due today' :
                                      `${daysRemaining} days left`})
                                  </span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {canCompleteAction(action) && action.actionStatus !== 'Completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => {
                                    setSelectedAction(action);
                                    setCompletionModal(true);
                                  }}
                                  className="text-green-600 hover:text-green-700"
                                />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={MessageSquare}
                                className="text-blue-600 hover:text-blue-700"
                              />
                            </div>
                            {overdue && (
                              <div className="flex items-center text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="ml-1 text-xs">Overdue</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Kanban View */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {['Open', 'In Progress', 'Completed'].map(status => (
                <Card key={status} className="p-4">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      {getStatusIcon(status)}
                      <span className="ml-2">{status}</span>
                      <span className="ml-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {filteredAndSortedActions.filter(a => a.actionStatus === status).length}
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {filteredAndSortedActions
                      .filter(action => action.actionStatus === status)
                      .map((action, index) => {
                        const daysRemaining = getDaysRemaining(action.targetDate, action.actionStatus);
                        const overdue = isOverdue(action.targetDate, action.actionStatus);

                        return (
                          <motion.div
                            key={action.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                              overdue ? 'border-l-4 border-l-red-500' : ''
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white leading-tight">
                                  {action.taskName}
                                </h4>
                                <span className={`px-1 py-0.5 text-xs font-medium rounded ${getPriorityColor(action.priority)}`}>
                                  {action.priority}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {action.hazardConcern}
                              </p>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className={`px-1 py-0.5 rounded ${getRiskColor(action.riskCategory)}`}>
                                  {action.riskCategory}
                                </span>
                                {action.targetDate && (
                                  <span className={overdue ? 'text-red-600' : 'text-gray-500'}>
                                    {format(new Date(action.targetDate), 'MMM dd')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                <span>{users.find(u => u._id === action.actionOwner?._id)?.name || 'Unassigned'}</span>
                              </div>

                              {canCompleteAction(action) && status !== 'Completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={CheckCircle}
                                  onClick={() => {
                                    setSelectedAction(action);
                                    setCompletionModal(true);
                                  }}
                                  className="w-full text-green-600 hover:text-green-700 text-xs"
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Enhanced Completion Modal */}
      <AnimatePresence>
        {completionModal && selectedAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
                  Complete Action Item
                </h3>

                <div className="space-y-6">
                  {/* Action Details */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Action Details</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Task:</strong> {selectedAction.taskName}</div>
                      <div><strong>Hazard:</strong> {selectedAction.hazardConcern}</div>
                      <div><strong>Recommendation:</strong> {selectedAction.recommendation}</div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getRiskColor(selectedAction.riskCategory)}`}>
                          {selectedAction.riskCategory}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(selectedAction.priority)}`}>
                          {selectedAction.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Completion Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Completion Date
                      </label>
                      <input
                        type="date"
                        value={completionData.actualCompletionDate}
                        onChange={(e) => setCompletionData({
                          ...completionData,
                          actualCompletionDate: e.target.value
                        })}
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Completion Status
                      </label>
                      <select
                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        defaultValue="Completed"
                      >
                        <option value="Completed">Completed</option>
                        <option value="Partially Completed">Partially Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Completion Evidence
                    </label>
                    <textarea
                      value={completionData.completionEvidence}
                      onChange={(e) => setCompletionData({
                        ...completionData,
                        completionEvidence: e.target.value
                      })}
                      rows={4}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Describe how the action was completed, what measures were implemented, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Additional Remarks
                    </label>
                    <textarea
                      value={completionData.remarks}
                      onChange={(e) => setCompletionData({
                        ...completionData,
                        remarks: e.target.value
                      })}
                      rows={3}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Any additional comments or observations..."
                    />
                  </div>

                  {/* File Upload Sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Photos
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload photos</p>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={() => {/* Handle photo upload */}}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Documents
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                        <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Click to upload documents</p>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={() => {/* Handle document upload */}}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCompletionModal(false);
                      setSelectedAction(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    icon={CheckCircle}
                    onClick={() => completeAction(selectedAction.id)}
                    loading={isLoading}
                  >
                    Complete Action
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Assign Modal */}
      <AnimatePresence>
        {bulkAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Bulk Assign Actions
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Actions to Assign
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {actions.map(action => (
                        <label key={action.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={bulkAssignData.selectedActions.has(action.id)}
                            onChange={(e) => {
                              const newSelected = new Set(bulkAssignData.selectedActions);
                              if (e.target.checked) {
                                newSelected.add(action.id);
                              } else {
                                newSelected.delete(action.id);
                              }
                              setBulkAssignData({
                                ...bulkAssignData,
                                selectedActions: newSelected
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {action.taskName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Assign to
                    </label>
                    <select
                      value={bulkAssignData.owner}
                      onChange={(e) => setBulkAssignData({
                        ...bulkAssignData,
                        owner: e.target.value
                      })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Owner</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={bulkAssignData.targetDate}
                      onChange={(e) => setBulkAssignData({
                        ...bulkAssignData,
                        targetDate: e.target.value
                      })}
                      className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setBulkAssignModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={bulkAssignActions}
                    disabled={bulkAssignData.selectedActions.size === 0 || !bulkAssignData.owner}
                  >
                    Assign Actions
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HIRAActions;