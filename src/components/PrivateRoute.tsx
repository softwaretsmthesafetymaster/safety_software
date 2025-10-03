import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import LoadingSpinner from "./UI/LoadingSpinner";
import { fetchUserProfile } from "../store/slices/authSlice";
import { fetchCompanyById } from "../store/slices/companySlice";

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredModule?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole = [],
  requiredModule,
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  const { isAuthenticated, user, isLoading: authLoading } = useAppSelector(
    (state) => state.auth
  );
  const { currentCompany, isLoading: companyLoading } = useAppSelector(
    (state) => state.company
  );

  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Fetch user on mount if not loaded
  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile()).finally(() => setInitialCheckDone(true));
    } else {
      setInitialCheckDone(true);
    }
  }, [user, dispatch]);

  // Fetch company after user is loaded and not platform owner
  useEffect(() => {
    if (user && user.role !== "platform_owner" && !currentCompany) {
      dispatch(fetchCompanyById(user.companyId));
    }
  }, [user, currentCompany, dispatch]);

  if (authLoading || !initialCheckDone) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    if (location.pathname === "/login" || location.pathname === "/register") {
      return <>{children}</>;
    }
    return <Navigate to="/login" replace />;
  }

  // Platform owner → redirect/render immediately
  if (user?.role === "platform_owner") {
    return <>{children}</>; // or <Navigate to="/platform-dashboard" replace />
  }

  // Wait until company is loaded
  if (companyLoading || !currentCompany) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  // Normal user checks
  if (!user.isPaid || !currentCompany.isActive) {
    if (location.pathname === "/payment") return <>{children}</>;
    return <Navigate to="/payment" replace />;
  }

  // Module access check
  if (requiredModule && !currentCompany.config?.modules?.[requiredModule]?.enabled) {
    if (location.pathname === "/dashboard") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }

  // Role check
  if (requiredRole.length > 0 && !requiredRole.includes(user.role)) {
    if (location.pathname === "/dashboard") return <>{children}</>;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
