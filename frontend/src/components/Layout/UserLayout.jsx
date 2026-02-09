import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import UserSidebar from '../User/UserSidebar';
import UserNavbar from '../User/UserNavbar';

const UserLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    console.log('Toggling sidebar, current state:', sidebarCollapsed);
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Calculate sidebar width for desktop
  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 80 : 240);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar - Fixed at top, full width, z-50 to stay above sidebar */}
      <UserNavbar />

      <div className="flex pt-14 lg:pt-[72px]">
        {/* Sidebar - Only visible on desktop, starts from top-0 to merge with navbar */}
        <UserSidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        {/* Main Content */}
        <div 
          className="flex-1 w-full transition-all duration-300"
          style={{ paddingLeft: `${sidebarWidth}px` }}
        >
          {/* Page Content - Responsive padding */}
          <main className="py-4 px-3 sm:px-4 md:py-5 md:px-6 lg:py-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
