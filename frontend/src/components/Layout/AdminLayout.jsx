import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import AdminSidebar from '../Admin/AdminSidebar'
import AdminNavbar from '../Admin/AdminNavbar'

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
  <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content
          Navbar is fixed on top, so we keep the main area full-width and add top padding
          equal to navbar height (h-20) so content isn't hidden under the fixed navbar. */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Navbar */}
        <AdminNavbar
          onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pt-20 p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
