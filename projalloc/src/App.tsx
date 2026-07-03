import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/components/layout/AuthProvider'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { AuthGuard } from '@/components/layout/AuthGuard'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { Home } from '@/pages/Home'
import { ProjectDetail } from '@/pages/ProjectDetail'
import { Results } from '@/pages/Results'
import { Login } from '@/pages/Login'
import { AccessDenied } from '@/pages/AccessDenied'
import { NotFound } from '@/pages/NotFound'
import { Dashboard } from '@/pages/admin/Dashboard'
import { AdminProjects } from '@/pages/admin/Projects'
import { AdminTeams } from '@/pages/admin/Teams'
import { AdminSpin } from '@/pages/admin/Spin'
import { Workspace } from '@/pages/Workspace'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
      <AuthGuard>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/results" element={<Results />} />
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route
          path="/workspace"
          element={
            <ProtectedRoute requiredRole="leader">
              <Workspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminProjects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/spin/:projectId"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSpin />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
      </AuthGuard>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
