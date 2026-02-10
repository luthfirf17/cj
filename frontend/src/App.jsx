import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layouts
import AdminLayout from './components/Layout/AdminLayout'
import UserLayout from './components/Layout/UserLayout'

// Auth Pages
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard'
import UserManagement from './pages/Admin/UserManagement'
import AdminSettings from './pages/Admin/AdminSettings'
import BackupRestore from './pages/Admin/BackupRestore'

// User Pages
import UserDashboard from './pages/User/UserDashboard'
import FinancialPage from './pages/User/FinancialPage'
import SettingsPage from './pages/User/SettingsPage'
import BackupDataPage from './pages/User/BackupDataPage'
import ClientSubmissionsPage from './pages/User/ClientSubmissionsPage'
import ClientsPage from './pages/User/ClientsPage'
// import UserProfile from './pages/User/Profile'
// ... other user pages

// Client Pages
import ClientBooking from './pages/ClientBooking'

// Common Pages
import NotFound from './pages/NotFound'
import LandingPage from './pages/LandingPage'
import PrivacyPolicy from './pages/User/PrivacyPolicy'
import TermsOfService from './pages/User/TermsOfService'

// Route Guards
import ProtectedRoute from './components/Auth/ProtectedRoute'
import RoleBasedRoute from './components/Auth/RoleBasedRoute'

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking/:bookingCode" element={<ClientBooking />} />
        <Route path="/client-booking/:userId" element={<ClientBooking />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Admin Routes - Protected & Role-based */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/:id" element={<div>User Detail (Coming Soon)</div>} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="backup-restore" element={<BackupRestore />} />
              
              {/* Transaction Routes */}
              <Route path="transactions" element={<div>Transaction List (Coming Soon)</div>} />
              <Route path="transactions/add" element={<div>Add Transaction (Coming Soon)</div>} />
              <Route path="transactions/:id" element={<div>Transaction Detail (Coming Soon)</div>} />
              
              {/* Report Routes */}
              <Route path="reports" element={<div>Reports (Coming Soon)</div>} />
              <Route path="reports/revenue" element={<div>Revenue Report (Coming Soon)</div>} />
              <Route path="reports/clients" element={<div>Client Report (Coming Soon)</div>} />
            </Route>
          </Route>
        </Route>

        {/* User Routes - Protected & Role-based */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleBasedRoute allowedRoles={['user']} />}>
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<Navigate to="/user/dashboard" replace />} />
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="financial" element={<FinancialPage />} />
              <Route path="backup" element={<BackupDataPage />} />
              <Route path="client-submissions" element={<ClientSubmissionsPage />} />
              
              {/* Bookings */}
              <Route path="bookings" element={<div>Booking List (Coming Soon)</div>} />
              <Route path="bookings/:id" element={<div>Booking Detail (Coming Soon)</div>} />
              
              {/* Services */}
              <Route path="services" element={<div>Service List (Coming Soon)</div>} />
              
              {/* Profile */}
              <Route path="profile" element={<div>User Profile (Coming Soon)</div>} />
              
              {/* Settings */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  )
}

export default App
