import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import AdminSidebar from '../Admin/AdminSidebar'
import AdminNavbar from '../Admin/AdminNavbar'

const AdminLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <AdminNavbar onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
