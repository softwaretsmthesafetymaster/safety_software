import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Save
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { updateHIRAActions, fetchHIRAById } from '../../store/slices/hiraSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { addNotification } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

const HIRAActions: React.FC = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentAssessment, isLoading } = useAppSelector((state) => state.hira);
  const { users } = useAppSelector((state) => state.user);

  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchHIRAById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  useEffect(() => {
    if (currentAssessment?.worksheetRows) {
      const actionItems = currentAssessment.worksheetRows
        .filter(row => row.recommendation && row.recommendation.trim() !== '')
        .map((row, index) => ({
          id: index,
          taskName: row.taskName,
          hazardConcern: row.hazardConcern,
          riskCategory: row.riskCategory,
          recommendation: row.recommendation,
          actionOwner: row.actionOwner || '',
          targetDate: row.targetDate || '',
          actionStatus: row.actionStatus || 'Open',
          remarks: row.remarks || ''
        }));
      setActions(actionItems);
    }
  }, [currentAssessment]);

  const updateAction = (index: number, field: string, value: any) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], [field]: value };
    setActions(updated);
  };

  const saveActions = async () => {
    try {
      const updatedWorksheetRows = currentAssessment?.worksheetRows.map((row, index) => {
        const action = actions.find(a => a.id === index);
        if (action) {
          return {
            ...row,
            actionOwner: action.actionOwner,
            targetDate: action.targetDate,
            actionStatus: action.actionStatus,
            remarks: action.remarks
          };
        }
        return row;
      });

      await dispatch(updateHIRAActions({
        companyId: user?.companyId!,
        id: id!,
        worksheetRows: updatedWorksheetRows
      })).unwrap();

      dispatch(addNotification({
        type: 'success',
        message: 'Action items updated successfully'
      }));
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to update action items'
      }));
    }
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
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            HIRA Action Items
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentAssessment?.title} - {currentAssessment?.assessmentNumber}
          </p>
        </div>
        <Button
          variant="primary"
          icon={Save}
          onClick={saveActions}
          loading={isLoading}
        >
          Save Changes
        </Button>
      </div>

      {/* Actions Summary */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Action Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
            <h3 className="font-medium text-red-900 dark:text-red-100">Open Actions</h3>
            <p className="text-2xl font-bold text-red-600">
              {actions.filter(a => a.actionStatus === 'Open').length}
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 dark:text-yellow-100">In Progress</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {actions.filter(a => a.actionStatus === 'In Progress').length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 dark:text-green-100">Completed</h3>
            <p className="text-2xl font-bold text-green-600">
              {actions.filter(a => a.actionStatus === 'Completed').length}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Items Table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Action Items Management
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Task & Hazard
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Risk Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Recommendation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Action Owner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Target Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {actions.map((action, index) => (
                <motion.tr
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.taskName}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {action.hazardConcern}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      action.riskCategory === 'Very High' ? 'bg-red-600 text-white' :
                      action.riskCategory === 'High' ? 'bg-red-100 text-red-800' :
                      action.riskCategory === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {action.riskCategory}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                      {action.recommendation}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={action.actionOwner}
                      onChange={(e) => updateAction(index, 'actionOwner', e.target.value)}
                      className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select Owner</option>
                      {users.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={action.targetDate}
                      onChange={(e) => updateAction(index, 'targetDate', e.target.value)}
                      className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={action.actionStatus}
                      onChange={(e) => updateAction(index, 'actionStatus', e.target.value)}
                      className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={action.remarks}
                      onChange={(e) => updateAction(index, 'remarks', e.target.value)}
                      className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      placeholder="Add remarks..."
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {actions.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No action items
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Complete the worksheet to generate action items from recommendations.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HIRAActions;