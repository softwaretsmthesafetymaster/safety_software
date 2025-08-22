import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import LoadingSpinner from './UI/LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredModule?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  requiredRole = [], 
  requiredModule 
}) => {
  const { isAuthenticated, user, isLoading } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);

  if (isLoading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  if (requiredRole.length > 0 && !requiredRole.includes(user?.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check module access
  if (requiredModule && currentCompany?.config?.modules) {
    const moduleConfig = currentCompany.config.modules[requiredModule];
    if (!moduleConfig?.enabled) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;