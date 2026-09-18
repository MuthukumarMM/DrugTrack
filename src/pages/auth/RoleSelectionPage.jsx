import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, HeartPulse, Hospital, PackageCheck, ShieldCheck, Truck, Warehouse } from 'lucide-react'
import { ROLES } from '../../constants/roles'
import AuthFrame from './AuthFrame'

const options = [
  { role: ROLES.CUSTOMER, label: 'Customer', copy: 'Discover top medicines and place secure orders.', icon: HeartPulse },
  { role: ROLES.MANUFACTURER, label: 'Manufacturer', copy: 'Manage products, batches, quality, and verified stock.', icon: Building2 },
  { role: ROLES.WAREHOUSE_MANAGER, label: 'Warehouse manager', copy: 'Receive, store, and dispatch stock across the network.', icon: Warehouse },
  { role: ROLES.DISTRIBUTOR, label: 'Distributor', copy: 'Coordinate regional medicine movement and fulfillment.', icon: Truck },
  { role: ROLES.PHARMACY, label: 'Pharmacy', copy: 'Run retail inventory, alerts, and patient fulfilment.', icon: PackageCheck },
  { role: ROLES.HOSPITAL, label: 'Hospital pharmacy', copy: 'Protect critical departmental medicines and continuity.', icon: Hospital },
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()

  return (
    <AuthFrame title="What brings you to DrugTrack?" subtitle="Choose the account type that matches your role so your workspace and permissions are set correctly.">
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">
        <ShieldCheck size={16} />
        Fast, secure, and role-aware onboarding.
      </div>

      <div className="mt-6 grid gap-3">
        {options.map(({ role, label, copy, icon: Icon }) => (
          <button
            key={role}
            onClick={() => navigate(`/register?role=${role}`)}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-teal-500 hover:bg-teal-50 hover:shadow-md"
          >
            <span className="rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 p-3 text-brand-700">
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-slate-900">{label}</b>
              <small className="mt-1 block text-slate-500">{copy}</small>
            </span>
            <ArrowRight size={16} className="text-slate-400" />
          </button>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link className="font-semibold text-brand-600" to="/login">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  )
}
