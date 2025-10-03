import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Calendar,
  User,
  FileText,
  Save,
  Upload
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { addNotification } from '../../store/slices/uiSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ActionItem {
  _id: string;
  observationNumber: string;
  observation: string;
  element: string;
  legalStandard: string;
  recommendation: string;
  riskLevel: string;
  riskScore: number;
  targetDate: string;
  status: string;
  auditId: {
    title: string;
    auditNumber: string;
  };
  assignedBy: {
    name: string;
  };
  actionTaken?: string;
  completionEvidence?: string;
  rejectionReason?: string;
  createdAt: string;
}

const MyActions: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTaken, setActionTaken] = useState('');
  const [completionEvidence, setCompletionEvidence] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      fetchMyActions();
    }
  }, [user?.companyId]);

  const fetchMyActions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/observations/${user?.companyId}/my-actions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setActions(data.observations || []);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to load action items'
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartAction = async (actionId: string) => {
    try {
      const response = await fetch(`${API_URL}/observations/${user?.companyId}/${actionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'in_progress' })
      });

      if (response.ok) {
        dispatch(addNotification({
          type: 'success',
          message: 'Action started successfully'
        }));
        fetchMyActions();
      }
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to start action'
      }));
    }
  };

  const handleCompleteAction = (action: ActionItem) => {
    setSelectedAction(action);
    setActionTaken(action.actionTaken || '');
    setCompletionEvidence(action.completionEvidence || '');
    setIsModalOpen(true);
  };

  const submitCompletion = async () => {
    if (!selectedAction) return;

    try {
      setIsSaving(true);
      const response = await fetch(`${API_URL}/observations/${user?.companyId}/${selectedAction._id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          actionTaken,
          completionEvidence
        }),
      });

      if (!response.ok) throw new Error('Failed to complete action');

      dispatch(addNotification({
        type: 'success',
        message: 'Action completed successfully'
      }));

      setIsModalOpen(false);
      setActionTaken('');
      setCompletionEvidence('');
      fetchMyActions();
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to complete action'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date() && new Date().getDate() !== new Date(targetDate).getDate();
  };

  const filteredActions = actions.filter(action => {
    if (!filterStatus) return true;
    return action.status === filterStatus;
  });

  const getActionStats = () => {
    const total = actions.length;
    const assigned = actions.filter(a => a.status === 'assigned').length;
    const inProgress = actions.filter(a => a.status === 'in_progress').length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const rejected = actions.filter(a => a.status === 'rejected').length;
    const overdue = actions.filter(a => isOverdue(a.targetDate) && !['completed', 'approved'].includes(a.status)).length;
    
    return { total, assigned, inProgress, completed, rejected, overdue };
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  const stats = getActionStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Action Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Observations and corrective actions assigned to you
          </p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {stats.total} action{stats.total !== 1 ? 's' : ''} assigned
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.assigned}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.completed}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.rejected}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {stats.overdue}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Action Items */}
      <div className="space-y-4">
        {filteredActions.map((action, index) => (
          <motion.div
            key={action._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`p-6 ${isOverdue(action.targetDate) && !['completed', 'approved'].includes(action.status) ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {action.observationNumber}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRiskColor(action.riskLevel)}`}>
                      {action.riskLevel.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {action.riskScore}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {action.observation}
                  </p>
                  
                  {action.element && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">Element:</span> {action.element}
                    </p>
                  )}
                  
                  {action.legalStandard && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">Legal Standard:</span> {action.legalStandard}
                    </p>
                  )}
                  
                  {action.recommendation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="font-medium">Recommendation:</span> {action.recommendation}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {action.auditId.auditNumber} - {action.auditId.title}
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Assigned by: {action.assignedBy.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Due: {format(new Date(action.targetDate), 'MMM dd, yyyy')}
                      {isOverdue(action.targetDate) && !['completed', 'approved'].includes(action.status) && (
                        <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(action.status)}`}>
                    {action.status.replace('_', ' ').toUpperCase()}
                  </span>
                  
                  {action.status === 'assigned' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStartAction(action._id)}
                    >
                      Start Action
                    </Button>
                  )}
                  
                  {(action.status === 'assigned' || action.status === 'in_progress') && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleCompleteAction(action)}
                    >
                      Complete Action
                    </Button>
                  )}
                </div>
              </div>

              {action.actionTaken && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Action Taken:
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {action.actionTaken}
                    </p>
                    {action.completionEvidence && (
                      <>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mt-3 mb-2">
                          Evidence:
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {action.completionEvidence}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {action.rejectionReason && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                      Rejection Reason:
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {action.rejectionReason}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        ))}

        {filteredActions.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filterStatus ? 'No actions with selected status' : 'No Action Items'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filterStatus 
                ? 'Try changing the filter to see other actions.'
                : "You don't have any observations assigned to you at the moment."}
            </p>
          </Card>
        )}
      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Complete Action"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Observation:
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              {selectedAction?.observation}
            </p>
          </div>

          {selectedAction?.recommendation && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Recommendation:
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                {selectedAction.recommendation}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Taken *
            </label>
            <textarea
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              rows={4}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Describe the actions you've taken to address this observation..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Completion Evidence
            </label>
            <textarea
              value={completionEvidence}
              onChange={(e) => setCompletionEvidence(e.target.value)}
              rows={3}
              className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="Provide evidence of completion (documents, photos, etc.)..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Save}
              loading={isSaving}
              onClick={submitCompletion}
              disabled={!actionTaken.trim()}
            >
              Complete Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyActions;