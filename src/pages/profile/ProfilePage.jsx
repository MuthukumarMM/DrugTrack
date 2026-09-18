import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { getOrganization, updateOrganization } from '../../services/organizationService'
import { updateUserProfile } from '../../services/userService'

const organizationFields = {
  [ROLES.MANUFACTURER]: [
    ['companyName', 'Company name'],
    ['licenseNumber', 'License number'],
    ['registrationNumber', 'Registration number'],
    ['phone', 'Organization phone'],
    ['address', 'Address'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
  ],
  [ROLES.WAREHOUSE_MANAGER]: [
    ['warehouseName', 'Warehouse name'],
    ['managerName', 'Manager name'],
    ['licenseNumber', 'License number'],
    ['phone', 'Warehouse phone'],
    ['address', 'Address'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
  ],
  [ROLES.DISTRIBUTOR]: [
    ['companyName', 'Company name'],
    ['licenseNumber', 'License number'],
    ['phone', 'Company phone'],
    ['warehouseAddress', 'Warehouse address'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
  ],
  [ROLES.PHARMACY]: [
    ['pharmacyName', 'Pharmacy name'],
    ['licenseNumber', 'License number'],
    ['pharmacistName', 'Pharmacist name'],
    ['phone', 'Pharmacy phone'],
    ['address', 'Address'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
    ['latitude', 'Latitude'],
    ['longitude', 'Longitude'],
  ],
  [ROLES.HOSPITAL]: [
    ['hospitalName', 'Hospital name'],
    ['licenseNumber', 'License number'],
    ['pharmacyDepartment', 'Pharmacy department'],
    ['contactPerson', 'Contact person'],
    ['phone', 'Hospital phone'],
    ['address', 'Address'],
    ['city', 'City'],
    ['state', 'State'],
    ['country', 'Country'],
    ['latitude', 'Latitude'],
    ['longitude', 'Longitude'],
  ],
  [ROLES.DELIVERY_STAFF]: [
    ['displayName', 'Display name'],
    ['phone', 'Phone'],
  ],
  [ROLES.CUSTOMER]: [
    ['displayName', 'Display name'],
    ['phone', 'Phone'],
  ],
}

const immutableFields = new Set(['id', 'uid', 'userId', 'email', 'role', 'status', 'verificationStatus', 'organizationId'])

function pickEditable(data, fields) {
  return Object.fromEntries(fields.map(([name]) => [name, data?.[name] ?? '']))
}

export default function ProfilePage() {
  const { currentUser, profile, role, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [identity, setIdentity] = useState({ displayName: '', phone: '', photoURL: '' })
  const [organization, setOrganization] = useState(null)

  const orgFields = useMemo(() => organizationFields[role] || [], [role])
  const hasOrganizationRecord = role !== ROLES.ADMIN

  useEffect(() => {
    let mounted = true
    setIdentity({
      displayName: profile?.displayName || '',
      phone: profile?.phone || '',
      photoURL: profile?.photoURL || '',
    })

    if (!hasOrganizationRecord) {
      setOrganization(null)
      setLoading(false)
      return () => {
        mounted = false
      }
    }

    getOrganization(role, currentUser.uid)
      .then(record => {
        if (!mounted) return
        setOrganization(pickEditable(record, orgFields))
      })
      .catch(() => {
        if (mounted) setOrganization(pickEditable({}, orgFields))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [currentUser, profile, role, orgFields, hasOrganizationRecord])

  if (loading) return <LoadingSpinner />

  const save = async event => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateUserProfile(currentUser.uid, identity)
      if (hasOrganizationRecord && organization) {
        const safeOrganization = Object.fromEntries(
          Object.entries(organization).filter(([key]) => !immutableFields.has(key)),
        )
        await updateOrganization(role, currentUser.uid, safeOrganization)
      }
      await refreshProfile(currentUser)
      toast.success('Profile updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const updateIdentity = event => setIdentity({ ...identity, [event.target.name]: event.target.value })
  const updateOrg = event => setOrganization({ ...organization, [event.target.name]: event.target.value })

  return (
    <>
      <PageHeader title="Profile" description="Manage your editable contact and organization details." />
      <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Account identity</h2>
          <p className="mt-1 text-sm text-slate-500">Role, email, UID, and status are protected fields.</p>
          <div className="mt-5 grid gap-3">
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input className="field mt-1" name="displayName" required value={identity.displayName} onChange={updateIdentity} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input className="field mt-1" name="phone" value={identity.phone} onChange={updateIdentity} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Photo URL
              <input className="field mt-1" name="photoURL" value={identity.photoURL} onChange={updateIdentity} />
            </label>
          </div>
          <dl className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-semibold">{profile?.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Role</dt>
              <dd className="font-semibold">{role?.replaceAll('_', ' ')}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status</dt>
              <dd className="font-semibold">{profile?.status?.replaceAll('_', ' ')}</dd>
            </div>
          </dl>
        </section>

        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">{role === ROLES.ADMIN ? 'Administrator' : 'Role information'}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {role === ROLES.ADMIN
              ? 'Administrator role and access must be managed through secure provisioning.'
              : 'These details are stored in your role-specific Firestore document.'}
          </p>
          {role === ROLES.ADMIN ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
              Admin accounts do not have a public organization profile.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {orgFields.map(([name, label]) => (
                <label className="text-sm font-medium text-slate-700" key={name}>
                  {label}
                  <input className="field mt-1" name={name} value={organization?.[name] ?? ''} onChange={updateOrg} />
                </label>
              ))}
            </div>
          )}
        </section>

        <div className="lg:col-span-2">
          <Button disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
        </div>
      </form>
    </>
  )
}
