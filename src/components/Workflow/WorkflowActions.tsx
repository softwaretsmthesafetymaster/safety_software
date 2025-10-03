import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Send, Play, Store as Stop, FileText, Users, Target } from 'lucide-react';
import Button from '../UI/Button';
import { useAppSelector } from '../../hooks/redux';

interface WorkflowActionsProps {
  module: string;
  item: any;
  onAction: (action: string, data?: any) => void;
  isLoading?: boolean;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  module,
  item,
  onAction,
  isLoading = false
}) => {
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);

  const getAvailableActions = () => {
    const moduleConfig = currentCompany?.config?.modules?.[module];
    if (!moduleConfig?.enabled) return [];

    const userRole = user?.role || '';
    const status = item?.status || '';

    switch (module) {
      case 'ptw':
        switch (status) {
          case 'draft':
            return [
              { action: 'submit', label: 'Submit for Approval', icon: Send, variant: 'primary' as const }
            ];
          case 'submitted':
            if (['safety_incharge', 'plant_head', 'hod'].includes(userRole)) {
              return [
                { action: 'approve', label: 'Approve', icon: CheckCircle, variant: 'success' as const },
                { action: 'reject', label: 'Reject', icon: XCircle, variant: 'danger' as const }
              ];
            }
            return [];
          case 'approved':
            return [
              { action: 'activate', label: 'Activate', icon: Play, variant: 'primary' as const }
            ];
          case 'active':
            return [
              { action: 'close', label: 'Close', icon: CheckCircle, variant: 'success' as const },
              { action: 'stop', label: 'Emergency Stop', icon: Stop, variant: 'danger' as const }
            ];
          default:
            return [];
        }

      case 'ims':
        switch (status) {
          case 'open':
            if (['safety_incharge', 'plant_head'].includes(userRole)) {
              return [
                { action: 'assign', label: 'Assign Investigation', icon: Users, variant: 'primary' as const }
              ];
            }
            return [];
          case 'investigating':
            return [
              { action: 'submit_findings', label: 'Submit Findings', icon: FileText, variant: 'primary' as const }
            ];
          case 'pending_closure':
            if (['safety_incharge', 'plant_head'].includes(userRole)) {
              return [
                { action: 'close', label: 'Close Incident', icon: CheckCircle, variant: 'success' as const },
                { action: 'reassign', label: 'Reassign', icon: Users, variant: 'warning' as const }
              ];
            }
            return [];
          default:
            return [];
        }

      case 'hazop':
        switch (status) {
          case 'planned':
            return [
              { action: 'start', label: 'Start Study', icon: Play, variant: 'primary' as const }
            ];
          case 'in_progress':
            return [
              { action: 'worksheet', label: 'Open Worksheet', icon: Target, variant: 'primary' as const },
              { action: 'complete', label: 'Complete Study', icon: CheckCircle, variant: 'success' as const }
            ];
          case 'completed':
            return [
              { action: 'close', label: 'Close Study', icon: CheckCircle, variant: 'success' as const }
            ];
          default:
            return [];
        }

      case 'hira':
        switch (status) {
          case 'draft':
            return [
              { action: 'start', label: 'Start Assessment', icon: Play, variant: 'primary' as const }
            ];
          case 'in_progress':
            return [
              { action: 'worksheet', label: 'Open Worksheet', icon: Target, variant: 'primary' as const },
              { action: 'complete', label: 'Complete Assessment', icon: CheckCircle, variant: 'success' as const }
            ];
          case 'completed':
            if (['safety_incharge', 'plant_head'].includes(userRole)) {
              return [
                { action: 'approve', label: 'Approve Assessment', icon: CheckCircle, variant: 'success' as const }
              ];
            }
            return [];
          default:
            return [];
        }

      case 'bbs':
        switch (status) {
          case 'open':
            if (['safety_incharge', 'plant_head', 'hod'].includes(userRole)) {
              return [
                { action: 'review', label: 'Review Observation', icon: CheckCircle, variant: 'primary' as const }
              ];
            }
            return [];
          case 'approved':
            return [
              { action: 'complete', label: 'Complete Action', icon: CheckCircle, variant: 'success' as const }
            ];
          case 'pending_closure':
            if (['safety_incharge', 'plant_head'].includes(userRole)) {
              return [
                { action: 'close', label: 'Close Observation', icon: CheckCircle, variant: 'success' as const }
              ];
            }
            return [];
          default:
            return [];
        }

      case 'audit':
        switch (status) {
          case 'planned':
            return [
              { action: 'start', label: 'Start Audit', icon: Play, variant: 'primary' as const }
            ];
          case 'in_progress':
            return [
              { action: 'checklist', label: 'Open Checklist', icon: CheckSquare, variant: 'primary' as const },
              { action: 'observations', label: 'Add Observations', icon: FileText, variant: 'secondary' as const },
              { action: 'complete', label: 'Complete Audit', icon: CheckCircle, variant: 'success' as const }
            ];
          case 'completed':
            return [
              { action: 'close', label: 'Close Audit', icon: CheckCircle, variant: 'success' as const }
            ];
          default:
            return [];
        }

      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-2"
    >
      {actions.map((action, index) => (
        <Button
          key={action.action}
          variant={action.variant}
          icon={action.icon}
          size="sm"
          loading={isLoading}
          onClick={() => onAction(action.action)}
        >
          {action.label}
        </Button>
      ))}
    </motion.div>
  );
};

export default WorkflowActions;