export const rolePermissions = {
    company_owner: {
      bbs: {
        view: ['all'],
        create: ['observation'],
        edit: ['observation'],
        review: ['observation'],
        approve: ['closure'],
        delete: ['observation'],
        manage: ['coaching', 'games', 'users']
      }
    },
    plant_head: {
      bbs: {
        view: ['plant_observations'],
        create: ['observation'],
        edit: ['observation'],
        review: ['observation'],
        approve: ['closure'],
        delete: [],
        manage: ['coaching', 'games']
      }
    },
    safety_incharge: {
      bbs: {
        view: ['plant_observations'],
        create: ['observation'],
        edit: ['observation'],
        review: ['observation'],
        approve: ['closure'],
        delete: [],
        manage: ['coaching', 'games']
      }
    },
    hod: {
      bbs: {
        view: ['area_observations'],
        create: ['observation'],
        edit: ['observation'],
        review: ['observation'],
        approve: [],
        delete: [],
        manage: []
      }
    },
    worker: {
      bbs: {
        view: ['own_observations'],
        create: ['observation'],
        edit: ['own_observation'],
        review: [],
        approve: [],
        delete: [],
        manage: []
      }
    },
    contractor: {
      bbs: {
        view: ['own_observations'],
        create: ['observation'],
        edit: ['own_observation'],
        review: [],
        approve: [],
        delete: [],
        manage: []
      }
    }
  };
  
  export const hasPermission = (userRole: string, module: string, action: string, context?: any) => {
    const permissions = rolePermissions[userRole as keyof typeof rolePermissions];
    if (!permissions || !permissions[module as keyof typeof permissions]) {
      return false;
    }
    
    const modulePermissions = permissions[module as keyof typeof permissions] as any;
    return modulePermissions[action]?.length > 0;
  };
  
  export const canViewObservation = (userRole: string, observation: any, userId: string) => {
    switch (userRole) {
      case 'company_owner':
        return true;
      case 'plant_head':
      case 'safety_incharge':
        return observation.plantId === userId || observation.plantId?._id === userId;
      case 'hod':
        return observation.areaId === userId || observation.observer?._id === userId;
      case 'worker':
      case 'contractor':
        return observation.observer?._id === userId;
      default:
        return false;
    }
  };
  
  export const canReviewObservation = (userRole: string, observation: any) => {
    return ['hod', 'plant_head', 'safety_incharge'].includes(userRole) && 
           observation.status === 'open';
  };
  
  export const canCompleteAction = (userRole: string, observation: any, userId: string) => {
    return observation.correctiveActions?.some((action: any) => 
      action.assignedTo?._id === userId && action.status !== 'completed'
    );
  };
  
  export const canApproveClosur = (userRole: string, observation: any) => {
    return ['safety_incharge', 'plant_head'].includes(userRole) && 
           observation.status === 'pending_closure';
  };