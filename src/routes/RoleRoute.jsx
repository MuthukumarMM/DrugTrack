import { Navigate, Outlet } from 'react-router-dom'
import LoadingSpinner from '../components/feedback/LoadingSpinner'
import { ROLE_DASHBOARDS, ROLES } from '../constants/roles'
import { useAuth } from '../context/AuthContext'

const blockedStatuses = new Set(['SUSPENDED', 'REJECTED'])
const approvedStatuses = new Set(['ACTIVE', 'APPROVED'])
const demoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

export default function RoleRoute({ roles }) {
  const { currentUser, role, profile, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!currentUser) return <Navigate to="/login" replace />
  if (!profile || !role) return <Navigate to="/account-status" replace />
  if (blockedStatuses.has(profile.status)) return <Navigate to="/account-status" replace />

  if (demoMode) return roles.includes(role) ? <Outlet /> : <Navigate to={ROLE_DASHBOARDS[role] || '/'} replace />

  const organizationRole = role !== ROLES.CUSTOMER && role !== ROLES.ADMIN
  if (organizationRole && !approvedStatuses.has(profile.status)) {
    return <Navigate to="/account-status" replace />
  }

  if (role === ROLES.CUSTOMER && !approvedStatuses.has(profile.status)) {
    return <Navigate to="/account-status" replace />
  }

  return roles.includes(role) ? <Outlet /> : <Navigate to={ROLE_DASHBOARDS[role] || '/'} replace />
}
