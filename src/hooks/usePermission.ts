import { useAppSelector } from './redux';
import { hasPermission, canViewObservation, canReviewObservation, canCompleteAction, canApproveClosur } from '../utils/rolePermissions';

export const usePermissions = () => {
  const { user } = useAppSelector((state) => state.auth);

  return {
    hasPermission: (module: string, action: string, context?: any) => 
      hasPermission(user?.role || '', module, action, context),
    
    canViewObservation: (observation: any) => 
      canViewObservation(user?.role || '', observation, user?._id || ''),
    
    canReviewObservation: (observation: any) => 
      canReviewObservation(user?.role || '', observation),
    
    canCompleteAction: (observation: any) => 
      canCompleteAction(user?.role || '', observation, user?._id || ''),
    
    canApproveClosur: (observation: any) => 
      canApproveClosur(user?.role || '', observation),
    
    isAdmin: () => ['plant_head', 'safety_incharge', 'hod', 'company_owner'].includes(user?.role || ''),
    
    canManageContent: () => ['plant_head', 'safety_incharge', 'company_owner'].includes(user?.role || ''),
    
    canViewAllPlants: () => user?.role === 'company_owner'
  };
};