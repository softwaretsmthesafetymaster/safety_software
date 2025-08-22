import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ChevronUp
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleSidebar } from '../../store/slices/uiSlice';

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
      { name: 'New Permit', href: '/ptw/permits/new' }
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
      { name: 'New Assessment', href: '/hira/assessments/new' }
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
      { name: 'New Audit', href: '/audit/audits/new' }
    ]
  },
];

const managementNavigation = [
  { name: 'Plant Management', href: '/management/plants', icon: Building },
  { name: 'User Management', href: '/management/users', icon: Users },
  { name: 'Company Settings', href: '/settings/company', icon: Settings },
];

const platformNavigation = [
  { name: 'Platform Dashboard', href: '/platform', icon: Monitor },
  { name: 'Companies', href: '/platform/companies', icon: Building },
];

const Sidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isModuleEnabled = (moduleKey: string | null) => {
    if (!moduleKey) return true; // Dashboard is always enabled
    return currentCompany?.config?.modules?.[moduleKey]?.enabled || false;
  };

  return (
    <motion.div
      initial={false}
      animate={{
        width: sidebarOpen ? 256 : 64,
      }}
      transition={{ duration: 0.3 }}
      className="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <motion.div
            initial={false}
            animate={{
              opacity: sidebarOpen ? 1 : 0,
              scale: sidebarOpen ? 1 : 0.8,
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center space-x-3"
          >
            <Shield className="h-8 w-8 text-blue-600" />
            {sidebarOpen && (
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                SafetyPro
              </div>
            )}
          </motion.div>
          <button
            onClick={handleToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.filter(item => isModuleEnabled(item.module)).map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            const isExpanded = expandedItems.includes(item.name);
            const hasSubItems = item.subItems && item.subItems.length > 0;
            
            return (
              <div key={item.name}>
                <div
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => hasSubItems && sidebarOpen ? toggleExpanded(item.name) : null}
                >
                  <NavLink
                    to={item.href}
                    className="flex items-center flex-1"
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
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
                      <ChevronDown className="h-4 w-4" />
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
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
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
        </nav>

        {/* Management Section */}
        {(user?.role === 'company_owner' || user?.role === 'plant_head') && (
          <div className="px-4 py-2">
            <motion.div
              initial={false}
              animate={{
                opacity: sidebarOpen ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              {sidebarOpen && 'Management'}
            </motion.div>
            <nav className="space-y-2">
              {managementNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
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
                );
              })}
            </nav>
          </div>
        )}

        {/* Platform Section */}
        {user?.role === 'platform_owner' && (
          <div className="px-4 py-2">
            <motion.div
              initial={false}
              animate={{
                opacity: sidebarOpen ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              {sidebarOpen && 'Platform'}
            </motion.div>
            <nav className="space-y-2">
              {platformNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${sidebarOpen ? 'mr-3' : ''}`} />
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
                );
              })}
            </nav>
          </div>
        )}

        {/* User Info */}
        <motion.div
          initial={false}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            height: sidebarOpen ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
          className="border-t border-gray-200 dark:border-gray-700 p-4 overflow-hidden"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
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