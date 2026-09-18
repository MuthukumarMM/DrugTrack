import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { ROLES } from '../../constants/roles'
import { subscribeUsers, updateOrganizationStatus, updateUserStatus } from '../../services/adminService'

const organizationRoles = new Set([
  ROLES.MANUFACTURER,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.DISTRIBUTOR,
  ROLES.PHARMACY,
  ROLES.HOSPITAL,
  ROLES.DELIVERY_STAFF,
])

const roles = [
  ROLES.ADMIN,
  ROLES.MANUFACTURER,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.DISTRIBUTOR,
  ROLES.PHARMACY,
  ROLES.HOSPITAL,
  ROLES.DELIVERY_STAFF,
  ROLES.CUSTOMER,
]

const actions = [
  { label: 'Approve', userStatus: 'APPROVED', organizationStatus: 'APPROVED' },
  { label: 'Reject', userStatus: 'REJECTED', organizationStatus: 'REJECTED' },
  { label: 'Suspend', userStatus: 'SUSPENDED', organizationStatus: 'SUSPENDED' },
  { label: 'Activate', userStatus: 'ACTIVE', organizationStatus: 'APPROVED' },
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => subscribeUsers(setUsers), [])

  const visible = useMemo(() => {
    if (!users) return []
    const term = search.toLowerCase()
    return users.filter(
      user =>
        (!role || user.role === role) &&
        (!status || user.status === status) &&
        `${user.displayName || ''} ${user.email || ''}`.toLowerCase().includes(term),
    )
  }, [users, search, role, status])

  if (!users) return <LoadingSpinner />

  const act = async (user, action) => {
    if (!confirm(`${action.label} ${user.displayName || user.email}?`)) return

    try {
      await updateUserStatus(user.id, action.userStatus)
      if (organizationRoles.has(user.role)) {
        await updateOrganizationStatus(user.role, user.id, action.organizationStatus)
      }
      toast.success(`${user.displayName || user.email} updated.`)
    } catch (error) {
      toast.error(error.message || 'Unable to update this user.')
    }
  }

  return (
    <>
      <PageHeader
        title="Users & organization approvals"
        description="Review applicants, activate approved organizations, and block unsafe accounts."
      />

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_220px]">
        <input className="field" placeholder="Search by name or email" value={search} onChange={event => setSearch(event.target.value)} />
        <select className="field bg-white" value={role} onChange={event => setRole(event.target.value)}>
          <option value="">All roles</option>
          {roles.map(item => (
            <option key={item} value={item}>
              {item.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        <select className="field bg-white" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {['PENDING_VERIFICATION', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'INACTIVE'].map(item => (
            <option key={item} value={item}>
              {item.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map(item => (
                <th className="p-3 font-semibold" key={item}>
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(user => (
              <tr className="border-t border-slate-100" key={user.id}>
                <td className="p-3 font-medium text-slate-950">{user.displayName || 'Unnamed user'}</td>
                <td className="p-3 text-slate-600">{user.email}</td>
                <td className="p-3 text-slate-600">{user.role?.replaceAll('_', ' ')}</td>
                <td className="p-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="flex flex-wrap gap-2 p-3">
                  {actions.map(action => (
                    <Button key={action.label} className="!px-3 !py-1.5 text-xs" onClick={() => act(user, action)}>
                      {action.label}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan="5">
                  No users match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
