export const getStatusColor = (status: string, module?: string): string => {
  const statusColors: Record<string, string> = {
    // PTW Status
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    stopped: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending_closure: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    
    // IMS Status
    open: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    investigating: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    
    // HAZOP Status
    planned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    
    // HIRA Status
    in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    
    // BBS Status
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    reassigned: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    
    // Severity Levels
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    
    // Risk Levels
    very_low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    very_high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    moderate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    
    // Acceptability
    acceptable: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    tolerable: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    unacceptable: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

export const formatStatus = (status: string): string => {
  return status.replace('_', ' ').toUpperCase();
};

export const getNextStatus = (currentStatus: string, module: string): string | null => {
  const statusFlows: Record<string, Record<string, string>> = {
    ptw: {
      draft: 'submitted',
      submitted: 'approved',
      approved: 'active',
      active: 'closed'
    },
    ims: {
      open: 'investigating',
      investigating: 'pending_closure',
      pending_closure: 'closed'
    },
    hazop: {
      planned: 'in_progress',
      in_progress: 'completed',
      completed: 'closed'
    },
    hira: {
      draft: 'in_progress',
      in_progress: 'completed',
      completed: 'approved'
    },
    bbs: {
      open: 'closed'
    },
    audit: {
      planned: 'in_progress',
      in_progress: 'completed',
      completed: 'closed'
    }
  };

  return statusFlows[module]?.[currentStatus] || null;
};

export const canTransitionStatus = (currentStatus: string, targetStatus: string, module: string): boolean => {
  const nextStatus = getNextStatus(currentStatus, module);
  return nextStatus === targetStatus;
};

export const getStatusActions = (status: string, module: string, userRole: string): string[] => {
  const actions: Record<string, Record<string, string[]>> = {
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

  return actions[module]?.[status] || [];
};

export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    low: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    critical: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
    minor: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    major: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
  };

  return colors[severity] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
};

export const getRiskLevelColor = (riskLevel: string): string => {
  const colors: Record<string, string> = {
    very_low: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    low: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    moderate: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400',
    very_high: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
  };

  return colors[riskLevel] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
};