import { useAppSelector } from '../hooks/redux';

export const useWorkflowConfig = (module: string) => {
  const { currentCompany } = useAppSelector((state) => state.company);
  
  return currentCompany?.config?.modules?.[module] || {};
};

export const getWorkflowSteps = (module: string, workflow: string, config: any) => {
  const moduleConfig = config?.flows || {};
  const workflowConfig = moduleConfig[workflow];
  
  if (!workflowConfig || !workflowConfig.steps) {
    // Default workflows
    const defaultWorkflows: Record<string, Record<string, any[]>> = {
      ptw: {
        approval: [
          { step: 1, role: 'safety_incharge', required: true },
          { step: 2, role: 'plant_head', required: true }
        ]
      },
      ims: {
        investigation: [
          { step: 1, role: 'safety_incharge', timeLimit: 24 },
          { step: 2, role: 'investigation_team', timeLimit: 72 }
        ]
      },
      audit: {
        completion: [
          { step: 1, role: 'auditor', timeLimit: 168 },
          { step: 2, role: 'safety_incharge', timeLimit: 72 }
        ]
      }
    };
    
    return defaultWorkflows[module]?.[workflow] || [];
  }
  
  return workflowConfig.steps;
};

export const canUserPerformAction = (
  action: string, 
  userRole: string, 
  module: string, 
  config: any
): boolean => {
  const moduleConfig = config?.flows || {};
  const actionConfig = moduleConfig[action];
  
  if (!actionConfig || !actionConfig.roles) {
    // Default permissions
    const defaultPermissions: Record<string, string[]> = {
      submit: ['company_owner', 'plant_head', 'safety_incharge', 'hod', 'contractor', 'worker'],
      approve: ['safety_incharge', 'plant_head', 'company_owner'],
      reject: ['safety_incharge', 'plant_head', 'company_owner'],
      assign: ['safety_incharge', 'plant_head'],
      close: ['safety_incharge', 'plant_head', 'company_owner'],
      review: ['safety_incharge', 'plant_head', 'hod'],
      investigate: ['safety_incharge', 'plant_head', 'hod'],
      complete: ['safety_incharge', 'plant_head', 'hod', 'contractor', 'worker']
    };
    
    return defaultPermissions[action]?.includes(userRole) || false;
  }
  
  return actionConfig.roles.includes(userRole);
};

export const getStatusTransitions = (module: string, currentStatus: string) => {
  const transitions: Record<string, Record<string, string[]>> = {
    ptw: {
      draft: ['submitted'],
      submitted: ['approved', 'rejected'],
      approved: ['active'],
      active: ['closed', 'stopped', 'expired'],
      stopped: ['active', 'closed'],
      expired: ['closed']
    },
    ims: {
      open: ['investigating'],
      investigating: ['pending_closure'],
      pending_closure: ['closed', 'investigating']
    },
    hazop: {
      planned: ['in_progress'],
      in_progress: ['completed'],
      completed: ['closed']
    },
    hira: {
      draft: ['in_progress'],
      in_progress: ['completed'],
      completed: ['approved']
    },
    bbs: {
      open: ['approved', 'reassigned'],
      approved: ['pending_closure'],
      pending_closure: ['closed', 'approved'],
      reassigned: ['approved']
    },
    audit: {
      planned: ['in_progress'],
      in_progress: ['completed'],
      completed: ['closed']
    }
  };
  
  return transitions[module]?.[currentStatus] || [];
};

export const isStatusTransitionValid = (
  module: string, 
  currentStatus: string, 
  targetStatus: string
): boolean => {
  const validTransitions = getStatusTransitions(module, currentStatus);
  return validTransitions.includes(targetStatus);
};

export const getWorkflowProgress = (module: string, status: string) => {
  const progressMap: Record<string, Record<string, number>> = {
    ptw: {
      draft: 0,
      submitted: 25,
      approved: 50,
      active: 75,
      closed: 100,
      stopped: 100,
      expired: 100,
      rejected: 0
    },
    ims: {
      open: 0,
      investigating: 50,
      pending_closure: 75,
      closed: 100
    },
    hazop: {
      planned: 0,
      in_progress: 50,
      completed: 75,
      closed: 100
    },
    hira: {
      draft: 0,
      in_progress: 33,
      completed: 66,
      approved: 100
    },
    bbs: {
      open: 0,
      approved: 33,
      pending_closure: 66,
      closed: 100,
      reassigned: 25
    },
    audit: {
      planned: 0,
      in_progress: 50,
      completed: 75,
      closed: 100
    }
  };
  
  return progressMap[module]?.[status] || 0;
};