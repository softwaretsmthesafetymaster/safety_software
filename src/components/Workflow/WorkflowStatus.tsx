import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, XCircle, AlertTriangle, User } from 'lucide-react';
import { format } from 'date-fns';

interface WorkflowStep {
  step: number;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approver?: {
    name: string;
    email: string;
  };
  timestamp?: string;
  comments?: string;
  timeLimit?: number;
}

interface WorkflowStatusProps {
  steps: WorkflowStep[];
  currentStep?: number;
  module: string;
}

const WorkflowStatus: React.FC<WorkflowStatusProps> = ({ 
  steps, 
  currentStep, 
  module 
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'pending':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const getStepColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-blue-100 text-blue-600 border-blue-300';
    }
    
    switch (status) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-600 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-600 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-600 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const isOverdue = (step: WorkflowStep) => {
    if (!step.timeLimit || step.status !== 'pending') return false;
    
    const now = new Date();
    const stepStart = new Date(step.timestamp || now);
    const hoursElapsed = (now.getTime() - stepStart.getTime()) / (1000 * 60 * 60);
    
    return hoursElapsed > step.timeLimit;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Workflow Progress
      </h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCurrent = currentStep === step.step;
          const StepIcon = getStepIcon(step.status);
          const overdue = isOverdue(step);
          
          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-4 p-4 rounded-lg border-2 ${getStepColor(step.status, isCurrent)} ${
                overdue ? 'ring-2 ring-red-300' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                isCurrent ? 'border-blue-500 bg-blue-500' :
                step.status === 'approved' || step.status === 'completed' ? 'border-green-500 bg-green-500' :
                step.status === 'rejected' ? 'border-red-500 bg-red-500' :
                'border-gray-300 bg-gray-300'
              }`}>
                <StepIcon className={`h-5 w-5 ${
                  isCurrent || step.status === 'approved' || step.status === 'completed' || step.status === 'rejected' 
                    ? 'text-white' 
                    : 'text-gray-600'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Step {step.step}: {step.role.replace('_', ' ').toUpperCase()}
                  </p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    step.status === 'approved' || step.status === 'completed' ? 'bg-green-100 text-green-800' :
                    step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    step.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {step.status.toUpperCase()}
                  </span>
                </div>
                
                {step.approver && (
                  <div className="flex items-center space-x-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {step.approver.name}
                    </span>
                  </div>
                )}
                
                {step.timestamp && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format(new Date(step.timestamp), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
                
                {step.comments && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                    "{step.comments}"
                  </p>
                )}
                
                {overdue && (
                  <div className="flex items-center space-x-1 mt-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">
                      Overdue by {Math.round((new Date().getTime() - new Date(step.timestamp || new Date()).getTime()) / (1000 * 60 * 60) - (step.timeLimit || 0))} hours
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {steps.filter(s => s.status === 'approved' || s.status === 'completed').length} of {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${(steps.filter(s => s.status === 'approved' || s.status === 'completed').length / steps.length) * 100}%` 
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-blue-600 h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatus;