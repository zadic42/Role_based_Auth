import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import AdminNavbar from './components/AdminNavbar'
import Sidebar from './components/Sidebar'
import UserLogin from './pages/UserLogin'
import UserSignup from './pages/UserSignup'
import AdminLogin from './pages/AdminLogin'
import SystemPerformance from './pages/admin/SystemPerformance'
import MFASettings from './pages/MFASettings'
import VerifyMFA from './pages/VerifyMFA'
import AdminAuditLogs from './pages/AdminAuditLogs'
import AdminErrorLogs from './pages/AdminErrorLogs'
import AdminBackups from './pages/AdminBackups'
import AuthCallback from './pages/AuthCallback'
import TrainerLogin from './pages/TrainerLogin'
import AddTrainer from './pages/AddTrainer'
import AdminTrainers from './pages/AdminTrainers'

// Protected Route wrapper for user routes
const ProtectedUserRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  if (!token || userRole !== 'user') {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// Protected Route wrapper for admin routes
const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  if (!token || userRole !== 'admin') {
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children, isAdmin = false }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 pt-16 pl-64">
        {isAdmin ? <AdminNavbar /> : <Navbar />}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: '#4aed88',
              },
            },
            error: {
              duration: 4000,
              theme: {
                primary: '#ff4b4b',
              },
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserSignup />} />
          <Route path="/trainers/login" element={<TrainerLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/verify-mfa" element={<VerifyMFA />} />
          <Route path="/auth-success" element={<AuthCallback />} />

          {/* Protected routes with authenticated layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Dashboard Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/admin/trainers"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <AdminTrainers />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/trainers/add"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <AddTrainer />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <div>Admin Dashboard Page</div>
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <AdminAuditLogs />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/error-logs"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <AdminErrorLogs />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/backups"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <AdminBackups />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedAdminRoute>
                <AuthenticatedLayout isAdmin>
                  <SystemPerformance />
                </AuthenticatedLayout>
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Team Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Analytics Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Documents Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Notifications Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Calendar Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Projects Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Messages Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/mfa-settings"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <MFASettings />
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/help"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Help Center Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Security Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedUserRoute>
                <AuthenticatedLayout>
                  <div>Settings Page</div>
                </AuthenticatedLayout>
              </ProtectedUserRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
