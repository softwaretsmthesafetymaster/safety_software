import React, { useEffect } from 'react';
import { href, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  Search,
  Target,
  Eye,
  CheckSquare,
  Users,
  Building,
  Settings,
  Monitor,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MapPin
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar } from '../../store/slices/uiSlice';

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!sidebarOpen) {
      setExpandedItem(null);
    }
  }, [sidebarOpen]);

  useEffect(() => {
    const currentModule = navigation.find(item =>
      item.subItems?.some(sub => location.pathname.startsWith(sub.href))
    );
    if (currentModule && sidebarOpen) {
      setExpandedItem(currentModule.name);
    }
  }, [location.pathname, sidebarOpen]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleToggleExpanded = (itemName: string, hasSubItems: boolean) => {
    if (!hasSubItems || !sidebarOpen) return;
    setExpandedItem(prev => (prev === itemName ? null : itemName));
  };

  const isModuleEnabled = (moduleKey: string | null) => {
    if (!moduleKey) return true;
    return currentCompany?.config?.modules?.[moduleKey]?.enabled|| false;
  };

  const branding = currentCompany?.config?.branding;
  const primaryColor = branding?.primaryColor || '#3b82f6';
  const companyDisplayName = branding?.companyName || currentCompany?.name || 'SafetyPro';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3, module: null },
    {
      name: 'PTW System',
      href: '/ptw',
      icon: FileText,
      module: 'ptw',
      subItems: [
        { name: 'Dashboard', href: '/ptw' },
        { name: 'Permits', href: '/ptw/permits' },
        { name: 'New Permit', href: '/ptw/permits/new' },
        { name: 'Checklist', href: '/ptw/permits/checklist'}
      ]
    },
    {
      name: 'Incident Management',
      href: '/ims',
      icon: AlertTriangle,
      module: 'ims',
      subItems: [
        { name: 'Dashboard', href: '/ims' },
        { name: 'Incidents', href: '/ims/incidents' },
        { name: 'Report Incident', href: '/ims/incidents/new' }
      ]
    },
    {
      name: 'HAZOP Studies',
      href: '/hazop',
      icon: Search,
      module: 'hazop',
      subItems: [
        { name: 'Dashboard', href: '/hazop' },
        { name: 'Studies', href: '/hazop/studies' },
        { name: 'New Study', href: '/hazop/studies/new' }
      ]
    },
    {
      name: 'HIRA Assessment',
      href: '/hira',
      icon: Target,
      module: 'hira',
      subItems: [
        { name: 'Dashboard', href: '/hira' },
        { name: 'Assessments', href: '/hira/assessments' },
        { name: 'New Assessment', href: '/hira/create' }
      ]
    },
    {
      name: 'BBS Observations',
      href: '/bbs',
      icon: Eye,
      module: 'bbs',
      subItems: [
        { name: 'Dashboard', href: '/bbs' },
        { name: 'Observations', href: '/bbs/observations' },
        { name: 'New Observation', href: '/bbs/observations/new' }
      ]
    },
    {
      name: 'Safety Audits',
      href: '/audit',
      icon: CheckSquare,
      module: 'audit',
      subItems: [
        { name: 'Dashboard', href: '/audit' },
        { name: 'Audits', href: '/audit/audits' },
        { name: 'New Audit', href: '/audit/audits/new' },
        { name: 'Template' , href: '/audit/templates'}
      ]
    },
  ];

  const managementNavigation = 
  user?.role === 'company_owner' ? [
    { name: 'Plant Management', href: '/management/plants', icon: Building },
    { name: 'User Management', href: '/management/users', icon: Users },
    { name: 'Area Management', href: '/management/areas', icon: MapPin },
  ] : user?.role === 'plant_head' ? [
    { name: 'User Management', href: '/management/users', icon: Users },
    { name: 'Area Management', href: '/management/areas', icon: MapPin },
  ] : [];

  const platformNavigation = [
    { name: 'Platform Dashboard', href: '/platform', icon: Monitor },
    { name: 'Companies', href: '/platform/companies', icon: Building },
  ];

  let navSections = [];

if (user?.role === 'platform_owner') {
  // Platform owner sees only platform navigation
  navSections = [
    { title: 'Platform', items: platformNavigation }
  ];

} else {
  // Normal Company Users
  navSections = [
    { title: '', items: navigation.filter(item => isModuleEnabled(item.module)) },
  ];

  if (user?.role === 'company_owner' || user?.role === 'plant_head') {
    navSections.push({
      title: 'Management',
      items: managementNavigation
    });
  }
}


  return (
    <motion.div
      initial={false}
      animate={{
        width: sidebarOpen ? 256 : 64,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-y-0 left-0 z-50 glass-strong shadow-smooth-lg border-r border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
          <motion.div
            initial={false}
            animate={{
              opacity: sidebarOpen ? 1 : 0,
              scale: sidebarOpen ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3 overflow-hidden"
          >
            {branding?.logo ? (
              <img
                src={branding.logo}
                alt={companyDisplayName}
                className="h-8 w-8 object-contain flex-shrink-0"
              />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                <Shield className="h-5 w-5" />
              </div>
            )}
            {sidebarOpen && (
              <div className="min-w-0">
                <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {companyDisplayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  Safety Management
                </div>
              </div>
            )}
          </motion.div>
          <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 smooth-transition"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {navSections.map((section, sectionIndex) => (
            <div key={section.title || `section-${sectionIndex}`}>
              {section.title && sidebarOpen && (
                <div className="px-2 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                const isExpanded = expandedItem === item.name;
                const hasSubItems = item.subItems && item.subItems.length > 0;

                return (
                  <div key={item.name}>
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 mt-1 text-sm font-medium rounded-lg smooth-transition cursor-pointer
                      ${isActive ? 'text-white shadow-smooth' : 'text-gray-600 dark:text-gray-300'}
                      ${!isActive && 'hover:bg-gray-100/50 dark:hover:bg-gray-700/50 hover:translate-x-0.5'}`}
                      style={isActive ? { backgroundColor: primaryColor } : undefined}
                      onClick={() => handleToggleExpanded(item.name, hasSubItems)}
                    >
                      <NavLink
                        to={item.href}
                        className={`flex items-center flex-1 ${!sidebarOpen ? 'justify-center' : ''}`}
                        // onClick={(e) => hasSubItems && e.preventDefault()}
                      >
                        <item.icon
                          className={`h-5 w-5 flex-shrink-0 ${sidebarOpen ? 'mr-3' : ''} ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                          style={isActive ? { color: 'white' } : undefined}
                        />
                        <motion.span
                          initial={false}
                          animate={{
                            opacity: sidebarOpen ? 1 : 0,
                            width: sidebarOpen ? 'auto' : 0,
                          }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden whitespace-nowrap"
                        >
                          {item.name}
                        </motion.span>
                      </NavLink>
                      {hasSubItems && sidebarOpen && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
                        </motion.div>
                      )}
                    </div>

                    {/* Sub Items */}
                    {hasSubItems && sidebarOpen && (
                      <motion.div
                        initial={false}
                        animate={{
                          height: isExpanded ? 'auto' : 0,
                          opacity: isExpanded ? 1 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-8 mt-2 space-y-1">
                          {item.subItems?.map((subItem) => (
                            <NavLink
                              key={subItem.href}
                              to={subItem.href}
                              className={`block px-3 py-1 text-sm rounded transition-colors ${
                                location.pathname === subItem.href
                                  ? 'text-white'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                              }`}
                              style={
                                location.pathname === subItem.href
                                  ? { backgroundColor: primaryColor + 'CC' }
                                  : undefined
                              }
                            >
                              {subItem.name}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <motion.div
          initial={false}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            height: sidebarOpen ? 'auto' : 0,
            padding: sidebarOpen ? '1rem' : '0rem 1rem',
          }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm"
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span>{user?.name?.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.role?.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
