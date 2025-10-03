import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { closeSidebar, setMobileView } from '../../store/slices/uiSlice';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, isMobile } = useAppSelector((state) => state.ui);

  // Handle window resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      dispatch(setMobileView(isMobileView));
      
      if (!isMobileView) {
        dispatch(closeSidebar());
      }
    };

    // Set initial value
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Close sidebar when clicking outside on mobile
  const handleClickOutside = (e: React.MouseEvent) => {
    if (isMobile && sidebarOpen) {
      const target = e.target as HTMLElement;
      if (!target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
        dispatch(closeSidebar());
      }
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block sidebar-container">
        <Sidebar isMobile={false} />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => dispatch(closeSidebar())}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-30 w-64 sidebar-container"
            >
              <Sidebar isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden smooth-transition ${
          !isMobile && (sidebarOpen ? 'lg:ml-64' : 'lg:ml-16')
        }`}
        onClick={handleClickOutside}
      >
        <Header />
        <main className="flex-1 overflow-y-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="p-4 md:p-6 lg:p-8"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Layout;