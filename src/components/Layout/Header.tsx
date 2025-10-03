import React, { useEffect } from 'react';
import { Search, Sun, Moon, User, LogOut, Settings, Bell, Menu } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { toggleTheme, toggleSidebar, setMobileView } from '../../store/slices/uiSlice';
import { logout } from '../../store/slices/authSlice';
import { Link } from 'react-router-dom';
import NotificationDropdown from '../Notifications/NotificationDropdown';

const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const mobileView = useAppSelector((state) => state.ui.isMobile);
  const { theme } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);
  const { currentCompany } = useAppSelector((state) => state.company);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      dispatch(setMobileView(isMobileView));
    };

    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const handleLogout = () => {
    dispatch(logout());
  };

 

  // Get branding from company config
  const branding = currentCompany?.config?.branding;
  const primaryColor = branding?.primaryColor || '#3b82f6';
  const companyDisplayName = branding?.companyName || currentCompany?.name || 'SafetyPro';

  const handleMenuToggle = () => {
    dispatch(toggleSidebar());
  };

  return (
    <header className="glass-strong border-b border-gray-200/50 dark:border-gray-700/50 shadow-smooth sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button */}
          <div className="flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-1 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 smooth-transition focus-ring mobile-menu-button"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={handleMenuToggle}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6" />
            </button>
          </div>
          
          {/* Company Branding */}
          <div className="flex items-center space-x-2 ml-2">
            {branding?.logo ? (
              <img 
                src={branding.logo} 
                alt={companyDisplayName}
                className="h-8 w-8 object-contain"
              />
            ) : (
              <div 
                className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {companyDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {companyDisplayName}
              </h1>
              {!mobileView && <p className="text-xs text-gray-500 dark:text-gray-400">
                Safety Management System
              </p>}
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search permits, incidents, audits..."
                className="block w-full pl-10 pr-64 py-2.5 border border-gray-300/50 dark:border-gray-600/50 rounded-lg leading-5 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm placeholder-gray-500 dark:placeholder-gray-400 focus-ring text-sm smooth-transition"
                style={{ borderColor: theme === 'light' ? primaryColor + '40' : undefined }}
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-1 md:space-x-4 ml-8">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus-ring rounded-full smooth-transition hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative group">
              <button className="flex items-center space-x-3 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus-ring rounded-lg smooth-transition hover:bg-gray-100/50 dark:hover:bg-gray-700/50">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
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
                <div className="text-left">
                  <span className="text-sm font-medium text-gray-900 dark:text-white block">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-lg shadow-smooth-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible smooth-transition border border-gray-200/50 dark:border-gray-700/50">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentCompany?.name}
                  </p>
                </div>
                
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User className="mr-3 h-4 w-4" />
                  Profile Settings
                </Link>
                
                {(user?.role === 'company_owner' || user?.role === 'platform_owner') && (
                  <Link
                    to="/settings/company"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Company Settings
                  </Link>
                )}
                
                {user?.role === 'platform_owner' && (
                  <Link
                    to="/platform"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Settings className="mr-3 h-4 w-4" />
                    Platform Management
                  </Link>
                )}
                
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;