import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { fetchUserProfile } from './store/slices/authSlice';
import { fetchCompanyById } from './store/slices/companySlice';
import { fetchPlants } from './store/slices/plantSlice';
import { fetchUsers } from './store/slices/userSlice';

// Layout Components
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';

// Auth Pages
import LandingPage from './pages/Landing/LandingPage';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PaymentPage from './pages/Payment/PaymentPage';

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard';

// PTW Module
import PermitDashboard from './pages/PTW/PermitDashboard';
import PermitList from './pages/PTW/PermitList';
import PermitForm from './pages/PTW/PermitForm';
import PermitDetails from './pages/PTW/PermitDetails';
import PermitApproval from './pages/PTW/PermitApproval';

// IMS Module
import IncidentDashboard from './pages/IMS/IncidentDashboard';
import IncidentList from './pages/IMS/IncidentList';
import IncidentForm from './pages/IMS/IncidentForm';
import IncidentDetails from './pages/IMS/IncidentDetails';
import IncidentInvestigation from './pages/IMS/IncidentInvestigation';
import IncidentActions from './pages/IMS/IncidentActions';

// HAZOP Module
import HAZOPDashboard from './pages/HAZOP/HAZOPDashboard';
import HAZOPList from './pages/HAZOP/HAZOPList';
import HAZOPForm from './pages/HAZOP/HAZOPForm';
import HAZOPWorksheet from './pages/HAZOP/HAZOPWorksheet';

// HIRA Module
import HIRADashboard from './pages/HIRA/HIRADashboard';
import HIRAList from './pages/HIRA/HIRAList';
import HIRAForm from './pages/HIRA/HIRAForm';
import HIRAWorksheet from './pages/HIRA/HIRAWorksheet';

// BBS Module
import BBSDashboard from './pages/BBS/BBSDashboard';
import BBSObservationList from './pages/BBS/BBSObservationList';
import BBSObservationForm from './pages/BBS/BBSObservationForm';

// Audit Module
import AuditDashboard from './pages/Audit/AuditDashboard';
import AuditList from './pages/Audit/AuditList';
import AuditForm from './pages/Audit/AuditForm';
import AuditChecklist from './pages/Audit/AuditChecklist';

// Management Pages
import PlantManagement from './pages/Management/PlantManagement';
import UserManagement from './pages/Management/UserManagement';
import AreaManagement from './pages/Management/AreaManagement';

// Platform Owner Pages
import PlatformDashboard from './pages/Platform/PlatformDashboard';
import CompanyList from './pages/Platform/CompanyList';

// Settings Pages
import CompanyConfig from './pages/Settings/CompanyConfig';
import ProfileSettings from './pages/Profile/ProfileSettings';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchUserProfile());
      if (user.companyId) {
        dispatch(fetchCompanyById(user.companyId));
        dispatch(fetchPlants({ companyId: user.companyId }));
        dispatch(fetchUsers({ companyId: user.companyId }));
      }
    }
  }, [dispatch, isAuthenticated, user]);

  return (
    <div className={`app ${theme}`}>
      <div className="app-content">
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment" element={<PaymentPage />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* PTW Module Routes */}
            <Route
              path="/ptw"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/new"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id/edit"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id/approve"
              element={
                <PrivateRoute requiredModule="ptw" requiredRole={['safety_incharge', 'plant_head', 'hod']}>
                  <Layout>
                    <PermitApproval />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* IMS Module Routes */}
            <Route
              path="/ims"
              element={
                <PrivateRoute requiredModule="ims">
                  <Layout>
                    <IncidentDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents"
              element={
                <PrivateRoute requiredModule="ims">
                  <Layout>
                    <IncidentList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/new"
              element={
                <PrivateRoute requiredModule="ims">
                  <Layout>
                    <IncidentForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id"
              element={
                <PrivateRoute requiredModule="ims">
                  <Layout>
                    <IncidentDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/edit"
              element={
                <PrivateRoute requiredModule="ims">
                  <Layout>
                    <IncidentForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/investigation"
              element={
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head']}>
                  <Layout>
                    <IncidentInvestigation />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/actions"
              element={
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head']}>
                  <Layout>
                    <IncidentActions />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* HAZOP Module Routes */}
            <Route
              path="/hazop"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hazop/studies"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hazop/studies/new"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hazop/studies/:id/worksheet"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPWorksheet />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* HIRA Module Routes */}
            <Route
              path="/hira"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRADashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/new"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/:id/worksheet"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAWorksheet />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* BBS Module Routes */}
            <Route
              path="/bbs"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSObservationList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations/new"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSObservationForm />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Audit Module Routes */}
            <Route
              path="/audit"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditList />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/new"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/:id/checklist"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditChecklist />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Management Routes */}
            <Route
              path="/management/plants"
              element={
                <PrivateRoute requiredRole={['company_owner', 'plant_head']}>
                  <Layout>
                    <PlantManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/management/plants/:plantId/areas"
              element={
                <PrivateRoute requiredRole={['company_owner', 'plant_head']}>
                  <Layout>
                    <AreaManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/management/users"
              element={
                <PrivateRoute requiredRole={['company_owner', 'plant_head']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Platform Owner Routes */}
            <Route
              path="/platform"
              element={
                <PrivateRoute requiredRole={['platform_owner']}>
                  <Layout>
                    <PlatformDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/platform/companies"
              element={
                <PrivateRoute requiredRole={['platform_owner']}>
                  <Layout>
                    <CompanyList />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Settings Routes */}
            <Route
              path="/settings/company"
              element={
                <PrivateRoute requiredRole={['company_owner', 'platform_owner']}>
                  <Layout>
                    <CompanyConfig />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <ProfileSettings />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;