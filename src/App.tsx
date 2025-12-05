import React, { useEffect,useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import LoadingSpinner from './components/UI/LoadingSpinner';
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
import PermitClosure from './pages/PTW/PermitClosure';
import PermitStop from './pages/PTW/PermitStop';
import ChecklistManager from './pages/PTW/Checklist';

// IMS Module
import IncidentDashboard from './pages/IMS/IncidentDashboard';
import IncidentList from './pages/IMS/IncidentList';
import IncidentForm from './pages/IMS/IncidentForm';
import IncidentDetails from './pages/IMS/IncidentDetails';
import IncidentInvestigation from './pages/IMS/IncidentInvestigation';
import IncidentActions from './pages/IMS/IncidentActions';
import IncidentAssignment from './pages/IMS/IncidentAssignment';
import IncidentClosure from './pages/IMS/IncidentClosure';

// HAZOP Module
import HAZOPDashboard from './pages/HAZOP/HAZOPDashboard';
import HAZOPList from './pages/HAZOP/HAZOPList';
import HAZOPForm from './pages/HAZOP/HAZOPForm';
import HAZOPWorksheet from './pages/HAZOP/HAZOPWorksheet';
import HAZOPDetails from './pages/HAZOP/HAZOPDetails';
import HAZOPClosure from './pages/HAZOP/HAZOPClosure';
import HAZOPNodeForm from './pages/HAZOP/HAZOPNodeForm';

// HIRA Module
import HIRADashboard from './pages/HIRA/HIRADashboard';
import HIRAList from './pages/HIRA/HIRAList';
import HIRAForm from './pages/HIRA/HIRAForm';
import HIRAWorksheet from './pages/HIRA/HIRAWorksheet';
import HIRADetails from './pages/HIRA/HIRADetails';
import HIRAClosure from './pages/HIRA/HIRAClosure';
import HIRAAssignment from './pages/HIRA/HIRAAssignment';
import HIRAActions from './pages/HIRA/HIRAActions';
import HIRAApproval from './pages/HIRA/HIRAApproval';

// BBS Module
import BBSDashboard from './pages/BBS/BBSDashboard';
import BBSObservationList from './pages/BBS/BBSObservationList';
import BBSObservationForm from './pages/BBS/BBSObservationForm';
import BBSDetails from './pages/BBS/BBSDetails';
import BBSReview from './pages/BBS/BBSReview';
import BBSActionCompletion from './pages/BBS/BBSActionCompletion';
import BBSGames from './pages/BBS/BBSGames';
import BBSCoaching from './pages/BBS/BBSCoaching';
import BBSClosure from './pages/BBS/BBSClosure';

// Audit Module
import AuditDashboard from './pages/Audit/AuditDashboard';
import AuditList from './pages/Audit/AuditList';
import AuditForm from './pages/Audit/AuditForm';
import AuditChecklist from './pages/Audit/AuditChecklist';
import AuditDetails from './pages/Audit/AuditDetails';
import AuditObservationForm from './pages/Audit/AuditObservationForm';
import AuditClosure from './pages/Audit/AuditClosure';
import TemplateList from './pages/Audit/TemplateList';
import TemplateDetail from './pages/Audit/TemplateDetail';
import TemplateForm from './pages/Audit/TemplateForm';
import ObservationManagement from './pages/Audit/ObservationManagement';
import ObservationForm from './pages/Audit/ObservationForm';
import MyActions from './pages/Audit/MyActions';
// Action Pages
import ActionCompletion from './pages/Actions/ActionCompletion';
import ActionReview from './pages/Actions/ActionReview';

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
import CompanyConfigAdmin from './pages/Platform/CompanyConfig';

// Notification Pages
import NotificationCenter from './pages/Notifications/NotificationCenter';
import PermitActivation from './pages/PTW/PermitActivation';
import PermitExtension from './pages/PTW/PermitExtension';




const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading: authLoading } = useAppSelector((state) => state.auth);
  const { currentCompany, isLoading: companyLoading } = useAppSelector((state) => state.company);
  const { theme } = useAppSelector((state) => state.ui);


  // Apply theme
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Fetch user profile on mount
useEffect(() => {
  dispatch(fetchUserProfile());
}, [dispatch]);

  // Fetch company data and related resources
  useEffect(() => {
    if (!user || user.role === 'platform_owner') return;
    if (user.companyId && !currentCompany) {
      dispatch(fetchCompanyById(user.companyId));
      dispatch(fetchPlants({ companyId: user.companyId }));
      dispatch(fetchUsers({ companyId: user.companyId }));
    }
  }, [dispatch, user, currentCompany]);

 
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
              path="/ptw/permits/checklist"
              element={
                <PrivateRoute requiredModule="ptw" requiredRole={['safety_incharge', 'plant_head', 'hod']}>
                  <Layout>
                    <ChecklistManager/>
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
            <Route
              path="/ptw/permits/:id/close"
              element={
                <PrivateRoute requiredModule="ptw">
                  <Layout>
                    <PermitClosure />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id/stop"
              element={
                <PrivateRoute requiredModule="ptw" requiredRole={['safety_incharge', 'plant_head', 'hod']}>
                  <Layout>
                    <PermitStop />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id/extend"
              element={
                <PrivateRoute requiredModule="ptw" requiredRole={['safety_incharge', 'plant_head', 'hod']}>
                  <Layout>
                    <PermitExtension />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ptw/permits/:id/activate"
              element={
                <PrivateRoute requiredModule="ptw" requiredRole={[]}>
                  <Layout>
                    <PermitActivation />
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
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head','hod']}>
                  <Layout>
                    <IncidentInvestigation />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/actions"
              element={
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head','hod']}>
                  <Layout>
                    <IncidentActions />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/assign"
              element={
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head']}>
                  <Layout>
                    <IncidentAssignment />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/ims/incidents/:id/close"
              element={
                <PrivateRoute requiredModule="ims" requiredRole={['safety_incharge', 'plant_head','hod']}>
                  <Layout>
                    <IncidentClosure />
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
            <Route
              path="/hazop/studies/:id"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hazop/studies/:id/close"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPClosure />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hazop/studies/:id/node"
              element={
                <PrivateRoute requiredModule="hazop">
                  <Layout>
                    <HAZOPNodeForm />
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
              path="/hira/create"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/edit/:id"
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
            <Route
              path="/hira/assessments/:id/assign"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAAssignment />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/:id"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRADetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/:id/close"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAClosure />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/:id/approve"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAApproval/>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/hira/assessments/:id/actions"
              element={
                <PrivateRoute requiredModule="hira">
                  <Layout>
                    <HIRAActions/>
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
            <Route
              path="/bbs/observations/:id"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations/:id/edit"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSObservationForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations/:id/review"
              element={
                <PrivateRoute requiredModule="bbs" requiredRole={['safety_incharge', 'plant_head', 'hod']}>
                  <Layout>
                    <BBSReview />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations/:id/complete"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSActionCompletion />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/games"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSGames />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/coaching"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSCoaching />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/bbs/observations/:id/approve"
              element={
                <PrivateRoute requiredModule="bbs">
                  <Layout>
                    <BBSClosure />
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
              path="/audit/my-actions"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <MyActions />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/templates"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <TemplateList/>
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/templates/new"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <TemplateForm />
                  </Layout>
                </PrivateRoute>
              }
            />

            
            <Route
              path="/audit/audits/:auditId/observations"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <ObservationForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/:auditId/manage"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <ObservationManagement/>
                  </Layout>
                </PrivateRoute>
              }
            />
              
            <Route
              path="/audit/templates/:id"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <TemplateDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/templates/:id/edit"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <TemplateForm />
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
              path="/audit/audits/:auditId/checklist"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditChecklist />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/:id"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditDetails />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/:auditId/observations"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditObservationForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit/audits/:id/close"
              element={
                <PrivateRoute requiredModule="audit">
                  <Layout>
                    <AuditClosure />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Management Routes */}
            <Route
              path="/management/plants"
              element={
                <PrivateRoute requiredRole={['company_owner']}>
                  <Layout>
                    <PlantManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/management/areas"
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
              path="/platform/companies/:companyId/config"
              element={
                <PrivateRoute requiredRole={['platform_owner']}>
                  <Layout>
                    <CompanyConfigAdmin />
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

        {/* Action Routes */}
        <Route
          path="/actions/:module/:itemId/complete"
          element={
            <PrivateRoute>
              <Layout>
                <ActionCompletion />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/actions/:module/:itemId/review"
          element={
            <PrivateRoute requiredRoles={['admin', 'safety', 'hod', 'manager', 'plantHead']}>
              <Layout>
                <ActionReview />
              </Layout>
            </PrivateRoute>
          }
        />            

            {/* Notification Routes */}
            <Route
              path="/notifications"
              element={
                <PrivateRoute>
                  <Layout>
                    <NotificationCenter />
                  </Layout>
                </PrivateRoute>
              }
            />

            {/* Catch all route */}
            <Route
              path="*"
              element={
                isAuthenticated === undefined ? (
                  <LoadingSpinner className="min-h-screen" />
                ) : (
                  <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />
                )
              }
            />
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