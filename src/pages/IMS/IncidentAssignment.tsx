import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Save,
  Users,
  Clock,
  AlertTriangle,
  Target,
  Shield
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { fetchIncidentById, assignIncidentInvestigation } from '../../store/slices/incidentSlice';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { addNotification } from '../../store/slices/uiSlice';

interface AssignmentData {
  assignedTo: string;
  team: string[];
  timeLimit: number;
  priority: string;
  assignmentComments: string;
}

const IncidentAssignment: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentIncident, isLoading } = useAppSelector((state) => state.incident);
  const { users } = useAppSelector((state) => state.user);
  const { currentCompany } = useAppSelector((state) => state.company);

  const { register, handleSubmit, formState: { errors } } = useForm<AssignmentData>({
    defaultValues: {
      timeLimit: 72,
      priority: 'medium'
    }
  });

  useEffect(() => {
    if (id && user?.companyId) {
      dispatch(fetchIncidentById({ companyId: user.companyId, id }));
    }
  }, [dispatch, id, user?.companyId]);

  const onSubmit = async (data: AssignmentData) => {
    if (!user?.companyId || !id) return;

    try {
      await dispatch(assignIncidentInvestigation({
        companyId: user.companyId,
        id,
        assignmentData: data
      })).unwrap();
      
      dispatch(addNotification({
        type: 'success',
        message: 'Investigation team assigned successfully'
      }));
      navigate(`/ims/incidents/${id}`);
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.message || 'Failed to assign investigation team'
      }));
    }
  };

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!currentIncident) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Incident not found
        </h3>
      </div>
    );
  }

  // Get investigation roles from config
  const imsConfig = currentCompany?.config?.ims;
  const investigationRoles = users.filter(u => 
    imsConfig?.roles?.includes(u.role) && ['safety_incharge', 'plant_head', 'hod'].includes(u.role)
  );

  // Get escalation based on severity
  const severityEscalation = imsConfig?.severityEscalation?.[currentIncident.severity] || ['safety_incharge'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Assign Investigation Team
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {currentIncident.incidentNumber} - Assign investigation team and set priorities
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => navigate(`/ims/incidents/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Save}
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Assign Investigation Team
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Incident Summary */}
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
                Incident Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Type:</strong> {currentIncident.type.replace('_', ' ').toUpperCase()}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Severity:</strong> 
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      currentIncident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      currentIncident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      currentIncident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {currentIncident.severity.toUpperCase()}
                    </span>
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Location:</strong> {currentIncident.location?.area}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Date/Time:</strong> {new Date(currentIncident.dateTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Reported by:</strong> {currentIncident.reportedBy?.name}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Plant:</strong> {currentIncident.plantId?.name}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Description:</strong> {currentIncident.description}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignment Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Investigation Assignment
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lead Investigator *
              </label>
              <select
                {...register('assignedTo', { required: 'Lead investigator is required' })}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select Lead Investigator</option>
                {investigationRoles.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role.replace('_', ' ').toUpperCase()})
                    {severityEscalation.includes(user.role) && (
                      <span> - Recommended for {currentIncident.severity} severity</span>
                    )}
                  </option>
                ))}
              </select>
              {errors.assignedTo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.assignedTo.message}
                </p>
              )}
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Recommended roles for {currentIncident.severity} severity: {severityEscalation.join(', ')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Investigation Team Members
              </label>
              <select
                {...register('team')}
                multiple
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                size={6}
              >
                {users.filter(u => u.role !== 'worker').map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role.replace('_', ' ').toUpperCase()}) - {user.plantId?.name || 'All Plants'}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hold Ctrl/Cmd to select multiple team members. Include relevant subject matter experts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Investigation Time Limit (hours) *
                </label>
                <select
                  {...register('timeLimit', { 
                    required: 'Time limit is required',
                    valueAsNumber: true
                  })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="24">24 hours (Critical/High severity)</option>
                  <option value="48">48 hours (Medium severity)</option>
                  <option value="72">72 hours (Standard)</option>
                  <option value="168">1 week (Low severity)</option>
                </select>
                {errors.timeLimit && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.timeLimit.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Investigation Priority *
                </label>
                <select
                  {...register('priority', { required: 'Priority is required' })}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>
                {errors.priority && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.priority.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="assignmentComments" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Assignment Instructions & Comments
              </label>
              <textarea
                {...register('assignmentComments')}
                rows={4}
                className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="Provide specific instructions for the investigation team, focus areas, key witnesses to interview, or any other relevant guidance..."
              />
            </div>
          </div>
        </Card>

        {/* Investigation Guidelines */}
        <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Investigation Guidelines & Requirements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Investigation Scope</h4>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Conduct thorough root cause analysis using appropriate methods</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Interview all relevant witnesses and affected persons</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Document all evidence and take necessary photographs</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Identify immediate, underlying, and root causes</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Deliverables Required</h4>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Complete investigation report with findings</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Root cause analysis (5 Whys and Fishbone)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Comprehensive corrective and preventive actions</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <span>Timeline and responsibility assignments</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Note:</strong> Investigation must be completed within the specified time limit. 
              Automatic reminders will be sent at 50% and 80% of the time limit.
            </p>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default IncidentAssignment;