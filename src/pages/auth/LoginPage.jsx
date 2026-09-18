import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthFrame from './AuthFrame'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { ROLE_DASHBOARDS, ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { loginUser, signOutUser } from '../../services/authService'
import { getUserProfile } from '../../services/userService'
import { demoAccounts } from '../../data/demoAccounts'

const loginRoles = [
  { value: '', label: 'Select workspace type' },
  { value: ROLES.CUSTOMER, label: 'Customer' },
  { value: ROLES.MANUFACTURER, label: 'Manufacturer' },
  { value: ROLES.WAREHOUSE_MANAGER, label: 'Warehouse manager' },
  { value: ROLES.DISTRIBUTOR, label: 'Distributor' },
  { value: ROLES.PHARMACY, label: 'Pharmacy' },
  { value: ROLES.HOSPITAL, label: 'Hospital' },
  { value: ROLES.DELIVERY_STAFF, label: 'Delivery staff' },
  { value: ROLES.ADMIN, label: 'Admin' },
]

const blockedStatuses = new Set(['SUSPENDED', 'REJECTED'])
const approvedStatuses = new Set(['ACTIVE', 'APPROVED'])
const demoMode = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true'

function destinationFor(profile) {
  if (!profile) return '/account-status'
  if (blockedStatuses.has(profile.status)) return '/account-status'
  if (demoMode) return ROLE_DASHBOARDS[profile.role] || '/'
  if (profile.role !== ROLES.ADMIN && profile.role !== ROLES.CUSTOMER && !approvedStatuses.has(profile.status)) {
    return '/account-status'
  }
  if (profile.role === ROLES.CUSTOMER && !approvedStatuses.has(profile.status)) return '/account-status'
  return ROLE_DASHBOARDS[profile.role] || '/'
}

export default function LoginPage() {
  const [form, setForm] = useState({ role: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { isConfigured, refreshProfile } = useAuth()

  const update = event => setForm({ ...form, [event.target.name]: event.target.value })

  const applyDemoAccount = account => {
    setForm({
      role: account.role,
      email: account.email,
      password: account.password,
    })
    toast.success(`${account.label} credentials loaded.`)
  }

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    try {
      const credential = await loginUser(form.email.trim(), form.password)
      const profile = await getUserProfile(credential.user.uid)

      if (!profile) {
        await signOutUser().catch(() => {})
        toast.error('Signed in, but your DrugTrack profile is missing.')
        navigate('/account-status', { replace: true })
        return
      }

      if (form.role && profile.role !== form.role) {
        toast(`This account is registered as ${profile.role.replaceAll('_', ' ')}. We will continue to the correct workspace.`, {
          icon: 'ℹ️',
        })
      }

      await refreshProfile(credential.user)
      toast.success('Signed in')
      navigate(destinationFor(profile), { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Choose your workspace type, then sign in with Firebase Authentication.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Select label="Workspace type" name="role" value={form.role} onChange={update}>
          {loginRoles.map(role => (
            <option key={role.value || 'select'} value={role.value}>
              {role.label}
            </option>
          ))}
        </Select>
        <Input label="Email" name="email" type="email" required value={form.email} onChange={update} />
        <Input label="Password" name="password" type="password" required value={form.password} onChange={update} />
        <div className="text-right text-sm">
          <Link className="text-brand-600 hover:text-brand-700" to="/forgot-password">
            Forgot password?
          </Link>
        </div>
        <Button disabled={busy || (!isConfigured && !demoMode)} className="w-full">
          {busy ? 'Signing in...' : 'Sign in'}
        </Button>
        {!isConfigured && !demoMode && <p className="text-xs text-amber-700">Add Firebase values to `.env` before signing in.</p>}
        {demoMode && !isConfigured && (
          <p className="text-xs text-teal-700 font-medium">Demo Mode Active: Click any quick demo account below to instantly explore roles.</p>
        )}
      </form>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Quick demo accounts</p>
        <div className="grid gap-2">
          {demoAccounts.map(account => (
            <button
              type="button"
              key={account.email}
              onClick={() => applyDemoAccount(account)}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm transition hover:border-teal-500 hover:bg-teal-50"
            >
              <div>
                <div className="font-semibold text-slate-800">{account.label}</div>
                <div className="text-slate-500">{account.email}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                {account.role}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to DrugTrack?{' '}
        <Link className="font-semibold text-brand-600" to="/get-started">
          Get started
        </Link>
      </p>
    </AuthFrame>
  )
}
