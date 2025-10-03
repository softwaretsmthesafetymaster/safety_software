import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';

interface WorkflowProgressProps {
  module: string;
  status: string;
  steps?: Array<{
    name: string;
    status: 'completed' | 'current' | 'pending' | 'skipped';
    timestamp?: string;
  }>;
}

const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  module,
  status,
  steps
}) => {
  const getDefaultSteps = (module: string, status: string) => {
    const stepMaps: Record<string, Array<{ name: string; statuses: string[] }>> = {
      ptw: [
        { name: 'Draft Created', statuses: ['draft', 'submitted', 'approved', 'active', 'closed'] },
        { name: 'Submitted for Approval', statuses: ['submitted', 'approved', 'active', 'closed'] },
        { name: 'Approved', statuses: ['approved', 'active', 'closed'] },
        { name: 'Activated', statuses: ['active', 'closed'] },
        { name: 'Closed', statuses: ['closed'] }
      ],
      ims: [
        { name: 'Incident Reported', statuses: ['open', 'investigating', 'pending_closure', 'closed'] },
        { name: 'Investigation Assigned', statuses: ['investigating', 'pending_closure', 'closed'] },
        { name: 'Investigation Complete', statuses: ['pending_closure', 'closed'] },
        { name: 'Incident Closed', statuses: ['closed'] }
      ],
      hazop: [
        { name: 'Study Planned', statuses: ['planned', 'in_progress', 'completed', 'closed'] },
        { name: 'Study Started', statuses: ['in_progress', 'completed', 'closed'] },
        { name: 'Study Completed', statuses: ['completed', 'closed'] },
        { name: 'Study Closed', statuses: ['closed'] }
      ],
      hira: [
        { name: 'Assessment Created', statuses: ['draft', 'in_progress', 'completed', 'approved'] },
        { name: 'Assessment Started', statuses: ['in_progress', 'completed', 'approved'] },
        { name: 'Assessment Completed', statuses: ['completed', 'approved'] },
        { name: 'Assessment Approved', statuses: ['approved'] }
      ],
      bbs: [
        { name: 'Observation Reported', statuses: ['open', 'approved', 'pending_closure', 'closed'] },
        { name: 'Observation Reviewed', statuses: ['approved', 'pending_closure', 'closed'] },
        { name: 'Action Completed', statuses: ['pending_closure', 'closed'] },
        { name: 'Observation Closed', statuses: ['closed'] }
      ],
      audit: [
        { name: 'Audit Planned', statuses: ['planned', 'in_progress', 'completed', 'closed'] },
        { name: 'Audit Started', statuses: ['in_progress', 'completed', 'closed'] },
        { name: 'Audit Completed', statuses: ['completed', 'closed'] },
        { name: 'Audit Closed', statuses: ['closed'] }
      ]
    };

    const moduleSteps = stepMaps[module] || [];
    
    return moduleSteps.map(step => ({
      name: step.name,
      status: step.statuses.includes(status) 
        ? (step.statuses[step.statuses.length - 1] === status ? 'current' : 'completed')
        : 'pending'
    }));
  };

  const workflowSteps = steps || getDefaultSteps(module, status);

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return CheckCircle;
      case 'current':
        return Clock;
      case 'skipped':
        return XCircle;
      default:
        return AlertTriangle;
    }
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'current':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      case 'skipped':
        return 'text-red-600 bg-red-100 border-red-300';
      default:
        return 'text-gray-400 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Workflow Progress
      </h3>
      
      <div className="space-y-3">
        {workflowSteps.map((step, index) => {
          const StepIcon = getStepIcon(step.status);
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4"
            >
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(step.status)}`}>
                <StepIcon className="h-5 w-5" />
              </div>
              
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {step.name}
                </p>
                {step.timestamp && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(step.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
              
              {index < workflowSteps.length - 1 && (
                <div className={`w-px h-8 ${
                  step.status === 'completed' ? 'bg-green-300' : 'bg-gray-300'
                }`} />
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {workflowSteps.filter(s => s.status === 'completed').length} of {workflowSteps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(workflowSteps.filter(s => s.status === 'completed').length / workflowSteps.length) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-blue-600 h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowProgress;