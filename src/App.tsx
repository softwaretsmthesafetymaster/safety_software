import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { fetchUserProfile } from './store/slices/authSlice';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/Landing/LandingPage';
import Register from './pages/Auth/Register';
import PaymentPage from './pages/Payment/PaymentPage';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import PermitDashboard from './pages/PTW/PermitDashboard';
import PermitList from './pages/PTW/PermitList';
import PermitForm from './pages/PTW/PermitForm';
import PermitDetails from './pages/PTW/PermitDetails';
import IncidentDashboard from './pages/IMS/IncidentDashboard';
import IncidentList from './pages/IMS/IncidentList';
import IncidentForm from './pages/IMS/IncidentForm';
import IncidentDetails from './pages/IMS/IncidentDetails';
import HAZOPDashboard from './pages/HAZOP/HAZOPDashboard';
import HIRADashboard from './pages/HIRA/HIRADashboard';
import BBSDashboard from './pages/BBS/BBSDashboard';
import AuditDashboard from './pages/Audit/AuditDashboard';
import PlantManagement from './pages/Management/PlantManagement';
import UserManagement from './pages/Management/UserManagement';
import PlatformDashboard from './pages/Platform/PlatformDashboard';
import CompanyConfig from './pages/Settings/CompanyConfig';
import ProfileSettings from './pages/Profile/ProfileSettings';
import LoadingSpinner from './components/UI/LoadingSpinner';
import PermitApproval from './pages/PTW/PermitApproval';
import IncidentActions from './pages/IMS/IncidentActions';
import IncidentInvestigation from './pages/IMS/IncidentInvestigation';
import CompanyList from './pages/Platform/CompanyList';
import HAZOPForm from './pages/HAZOP/HAZOPForm';
import HAZOPList from './pages/HAZOP/HAZOPList';
import HAZOPWorksheet from './pages/HAZOP/HAZOPWorksheet';
import BBSObservationForm from './pages/BBS/BBSObservationForm';
import BBSObservationList from './pages/BBS/BBSObservationList';
import AuditChecklist from './pages/Audit/AuditChecklist';
import AuditForm from './pages/Audit/AuditForm';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
      </Router>
    </Provider>
  );
}

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, token,user } = useAppSelector((state) => state.auth);
  const { theme } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(fetchUserProfile());
    }

  }, [dispatch, token, isAuthenticated]);

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard/>} />
        
        {/* PTW Routes */}
        <Route path="/ptw" element={<PermitDashboard />} />
        <Route path="/ptw/permits" element={<PermitList />} />
        <Route path="/ptw/permits/new" element={<PermitForm />} />
        <Route path="/ptw/permits/:id" element={<PermitDetails />} />
        <Route path="/ptw/permits/:id/edit" element={<PermitForm />} />
        <Route path="/ptw/permits/:id/approval" element={<PermitApproval />} />
        <Route path="/ptw/permits/:id/submit" element={<PermitForm />} />
        <Route path="/ptw/permits/:id/approve" element={<PermitApproval />} />
        <Route path="/ptw/permits/:id/approve/:decision" element={<PermitApproval />} />
        
        {/* Company Management Routes */}
        
        {/* IMS Routes */}
        <Route path="/ims" element={<IncidentDashboard />} />
        <Route path="/ims/incidents" element={<IncidentList />} />
        <Route path="/ims/incidents/new" element={<IncidentForm />} />
        <Route path="/ims/incidents/:id" element={<IncidentDetails />} />
        <Route path="/ims/incidents/:id/edit" element={<IncidentForm />} />
        <Route path="/ims/incidents/:id/notify" element={<IncidentActions />} />
        <Route path="/ims/incidents/:id/assign" element={<IncidentInvestigation />} />
        <Route path="/ims/incidents/:id/assign/edit" element={<IncidentInvestigation />} />
        <Route path="/ims/incidents/:id/assign/submit" element={<IncidentInvestigation />} />

        
        {/* HAZOP Routes */}
        <Route path="/hazop" element={<HAZOPDashboard />} />
        <Route path="/hazop/studies/new" element={<HAZOPForm />} />
        <Route path="/hazop/studies" element={<HAZOPList />} />
        <Route path="/hazop/studies/:id" element={<HAZOPWorksheet />} />
        <Route path="/hazop/studies/:id/edit" element={<HAZOPForm />} />
        
        
        {/* HIRA Routes */}
        <Route path="/hira" element={<HIRADashboard />} />
        
        {/* BBS Routes */}
        <Route path="/bbs" element={<BBSDashboard />} />
        <Route path="/bbs/observations/new" element={<BBSObservationForm />} />
        <Route path="/bbs/observations" element={<BBSObservationList />} />
        <Route path="/bbs/observations/:id" element={<BBSObservationForm />} />
        <Route path="/bbs/observations/:id/edit" element={<BBSObservationForm />} />

        
        {/* Audit Routes */}
        <Route path="/audit" element={<AuditDashboard />} />
        <Route path="/audit/checklist" element={<AuditChecklist />} />
        <Route path="/audit/audits/new" element={<AuditForm />} />
        <Route path="/audit/audits/:id" element={<AuditForm />} />
        <Route path="/audit/audits/:id/edit" element={<AuditForm />} />
        <Route path="/audit/audits/:id/checklist" element={<AuditChecklist />} />
        <Route path="/audit/audits/:id/checklist/edit" element={<AuditChecklist />} />
        <Route path="/audit/audits/:id/checklist/submit" element={<AuditChecklist />} />
        <Route path="/audit/audits/:id/checklist/approve" element={<AuditChecklist />} />
        <Route path="/audit/audits/:id/checklist/approve/:decision" element={<AuditChecklist />} />

        
        {/* Management Routes */}
        <Route path="/management/plants" element={<PlantManagement />} />
        <Route path="/management/users" element={<UserManagement />} />

        
        {/* Platform Routes (Platform Owner only) */}
        {user?.role === 'platform_owner' && (
          <>
            <Route path="/platform" element={<PlatformDashboard />} />
            <Route path="/platform/companies/:id/config" element={<CompanyConfig />} />
            <Route path="/platform/companies" element={<CompanyList />} />
            
          </>
        )}
        
        {/* Settings Routes */}
        
        <Route path="/profile" element={<ProfileSettings />} />
        <Route path="/settings/company" element={<CompanyConfig />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;