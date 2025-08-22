import { useState, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './redux';
import { addNotification } from '../store/slices/uiSlice';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface WorkflowAction {
  action: string;
  data?: any;
  confirmMessage?: string;
}

export const useWorkflow = (module: string, itemId: string) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [isProcessing, setIsProcessing] = useState(false);

  const processWorkflow = useCallback(async (workflowAction: WorkflowAction) => {
    if (!user?.companyId || !itemId) return false;

    // Show confirmation if required
    if (workflowAction.confirmMessage) {
      if (!window.confirm(workflowAction.confirmMessage)) {
        return false;
      }
    }

    setIsProcessing(true);
    
    try {
      const response = await axios.post(
        `${API_URL}/${module}/${user.companyId}/${itemId}/workflow`,
        {
          action: workflowAction.action,
          data: workflowAction.data || {}
        }
      );

      dispatch(addNotification({
        type: 'success',
        message: `${workflowAction.action} completed successfully`
      }));

      return response.data;
    } catch (error: any) {
      dispatch(addNotification({
        type: 'error',
        message: error.response?.data?.message || `Failed to ${workflowAction.action}`
      }));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [module, itemId, user?.companyId, dispatch]);

  const getAvailableActions = useCallback((currentStatus: string, userRole: string) => {
    const moduleConfig = currentCompany?.config?.modules?.[module];
    if (!moduleConfig?.enabled) return [];

    // Get workflow configuration for the module
    const workflows = moduleConfig.flows || {};
    
    // Return available actions based on current status and user role
    const actions: Record<string, string[]> = {
      ptw: {
        draft: ['submit', 'edit', 'delete'],
        submitted: ['approve', 'reject'],
        approved: ['activate'],
        active: ['close', 'stop', 'extend'],
        expired: ['extend', 'close']
      },
      ims: {
        open: ['assign', 'edit'],
        investigating: ['submit_findings', 'add_actions'],
        pending_closure: ['close', 'reopen']
      },
      hazop: {
        planned: ['start', 'edit'],
        in_progress: ['add_session', 'add_node', 'complete'],
        completed: ['close', 'reopen']
      },
      hira: {
        draft: ['submit', 'edit'],
        in_progress: ['complete', 'edit'],
        completed: ['approve', 'reject']
      },
      bbs: {
        open: ['review', 'close', 'edit']
      },
      audit: {
        planned: ['start', 'edit'],
        in_progress: ['complete', 'add_finding'],
        completed: ['close', 'add_action']
      }
    };

    return actions[module]?.[currentStatus] || [];
  }, [module, currentCompany]);

  const canPerformAction = useCallback((action: string, userRole: string) => {
    const moduleConfig = currentCompany?.config?.modules?.[module];
    if (!moduleConfig?.enabled) return false;

    // Check if user role has permission for this action
    const workflows = moduleConfig.flows || {};
    const actionConfig = workflows[action];
    
    if (!actionConfig || !actionConfig.roles) {
      // Default permissions if no specific config
      const defaultPermissions: Record<string, string[]> = {
        submit: ['company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker'],
        approve: ['safety_incharge', 'plant_head', 'company_owner'],
        reject: ['safety_incharge', 'plant_head', 'company_owner'],
        assign: ['safety_incharge', 'plant_head'],
        close: ['safety_incharge', 'plant_head', 'company_owner']
      };
      
      return defaultPermissions[action]?.includes(userRole) || false;
    }

    return actionConfig.roles.includes(userRole);
  }, [module, currentCompany]);

  return {
    processWorkflow,
    getAvailableActions,
    canPerformAction,
    isProcessing
  };
};