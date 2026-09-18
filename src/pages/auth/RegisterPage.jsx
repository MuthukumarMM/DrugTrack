import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthFrame from './AuthFrame'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { PUBLIC_ROLES, ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { registerUser } from '../../services/authService'

const orgRoles = [ROLES.MANUFACTURER, ROLES.WAREHOUSE_MANAGER, ROLES.DISTRIBUTOR, ROLES.PHARMACY, ROLES.HOSPITAL]

const roleCopy = {
  [ROLES.CUSTOMER]: {
    label: 'Customer',
    title: 'Medicine ordering account',
    description: 'Browse verified catalogue listings, manage addresses, place trusted orders, and track deliveries.',
    orgLabel: '',
  },
  [ROLES.MANUFACTURER]: {
    label: 'Manufacturer',
    title: 'Manufacturer organization',
    description: 'Register your licensed manufacturing company for drugs, batches, QR verification, and inventory.',
    orgLabel: 'Company name',
  },
  [ROLES.WAREHOUSE_MANAGER]: {
    label: 'Warehouse manager',
    title: 'Warehouse operation',
    description: 'Register a warehouse workspace for stock receipt, storage, picking, packing, and dispatch workflows.',
    orgLabel: 'Warehouse name',
  },
  [ROLES.DISTRIBUTOR]: {
    label: 'Distributor',
    title: 'Distribution organization',
    description: 'Register your distribution business for regional inventory, downstream orders, and logistics.',
    orgLabel: 'Company name',
  },
  [ROLES.PHARMACY]: {
    label: 'Pharmacy',
    title: 'Retail pharmacy',
    description: 'Register a licensed pharmacy for sale-ready stock, expiry alerts, orders, and customer fulfillment.',
    orgLabel: 'Pharmacy name',
  },
  [ROLES.HOSPITAL]: {
    label: 'Hospital',
    title: 'Hospital pharmacy department',
    description: 'Register hospital pharmacy operations for departments, emergency stock, and batch traceability.',
    orgLabel: 'Hospital name',
  },
}

const initialForm = role => ({
  role,
  displayName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  licenseNumber: '',
  registrationNumber: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  contactPerson: '',
})

export default function RegisterPage() {
  const [params] = useSearchParams()
  const initialRole = PUBLIC_ROLES.includes(params.get('role')) ? params.get('role') : ROLES.CUSTOMER
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm(initialRole))
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { isConfigured } = useAuth()
  const isOrganization = useMemo(() => orgRoles.includes(form.role), [form.role])
  const selectedRole = roleCopy[form.role] || roleCopy[ROLES.CUSTOMER]

  const update = event => {
    const { name, value } = event.target
    if (name === 'role') {
      setForm({ ...initialForm(value), displayName: form.displayName, phone: form.phone })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const validateStep = () => {
    if (step === 1 && (!form.role || !form.displayName.trim() || !form.phone.trim())) {
      toast.error('Choose account type, full name, and phone.')
      return false
    }
    if (
      step === 2 &&
      isOrganization &&
      (!form.organizationName.trim() || !form.licenseNumber.trim() || !form.address.trim() || !form.city.trim())
    ) {
      toast.error('Organization name, license, address, and city are required.')
      return false
    }
    return true
  }

  const next = () => {
    if (!validateStep()) return
    setStep(Math.min(3, step + 1))
  }

  const submit = async event => {
    event.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.')

    setBusy(true)
    try {
      await registerUser({ ...form, email: form.email.trim() })
      toast.success(isOrganization ? 'Account created. Await administrator approval.' : 'Customer account created.')
      navigate(isOrganization ? '/account-status' : '/shop', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to create account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthFrame title="Create your DrugTrack account" subtitle={`${selectedRole.title}. Step ${step} of 3.`}>
      <div className="mt-5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        {selectedRole.description}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {step === 1 && (
          <>
            <Select label="Account type" name="role" value={form.role} onChange={update}>
              {PUBLIC_ROLES.map(role => (
                <option key={role} value={role}>
                  {(roleCopy[role]?.label || role).replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
            <Input label="Full name" name="displayName" required value={form.displayName} onChange={update} />
            <Input label="Phone" name="phone" type="tel" required value={form.phone} onChange={update} />
          </>
        )}

        {step === 2 && (
          <>
            {isOrganization ? (
              <>
                <Input
                  label={selectedRole.orgLabel}
                  name="organizationName"
                  required
                  value={form.organizationName}
                  onChange={update}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="License number" name="licenseNumber" required value={form.licenseNumber} onChange={update} />
                  <Input label="Registration number" name="registrationNumber" value={form.registrationNumber} onChange={update} />
                </div>
                <Input label="Contact person" name="contactPerson" value={form.contactPerson} onChange={update} />
                <Input label="Address" name="address" required value={form.address} onChange={update} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input label="City" name="city" required value={form.city} onChange={update} />
                  <Input label="State" name="state" required value={form.state} onChange={update} />
                  <Input label="Country" name="country" required value={form.country} onChange={update} />
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
                Customer accounts become active immediately after Firebase registration. Your cart, orders, addresses,
                notifications, reviews, and tracking pages stay private to your account.
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Input label="Email" name="email" type="email" required value={form.email} onChange={update} />
            <Input
              label="Password"
              name="password"
              type="password"
              minLength="6"
              required
              value={form.password}
              onChange={update}
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              minLength="6"
              required
              value={form.confirmPassword}
              onChange={update}
            />
          </>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <button type="button" className="rounded-xl border border-slate-200 px-4 py-2 font-semibold" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < 3 ? (
            <Button type="button" className="ml-auto" onClick={next}>
              Continue
            </Button>
          ) : (
            <Button disabled={busy || !isConfigured} className="ml-auto">
              {busy ? 'Creating...' : 'Create account'}
            </Button>
          )}
        </div>

        {!isConfigured && <p className="text-xs text-amber-700">Add Firebase values to `.env` before registration.</p>}
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link className="font-semibold text-brand-600" to="/login">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}
