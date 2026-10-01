import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, PackageCheck, ShoppingCart, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { signOutUser } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { ROLES } from '../constants/roles'
import { subscribeCart } from '../services/cartService'
import { subscribeNotifications } from '../services/notificationService'

function Badge({ children }) {
  if (!children) return null
  return (
    <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
      {children}
    </span>
  )
}

export default function RoleLayout({ role, links = [] }) {
  const { currentUser, profile, clearSession } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [cart, setCart] = useState(null)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!currentUser || ![ROLES.CUSTOMER, ROLES.PHARMACY, ROLES.HOSPITAL].includes(role)) return undefined
    return subscribeCart(currentUser.uid, setCart)
  }, [currentUser, role])

  useEffect(() => {
    if (!currentUser || role !== ROLES.CUSTOMER) return undefined
    return subscribeNotifications(currentUser.uid, setNotifications)
  }, [currentUser, role])

  const cartCount = useMemo(() => (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0), [cart])
  const unreadCount = useMemo(() => notifications.filter(item => !item.isRead).length, [notifications])
  const buyerBasePath = role === ROLES.PHARMACY ? '/pharmacy' : role === ROLES.HOSPITAL ? '/hospital' : ''
  const isBuyer = [ROLES.CUSTOMER, ROLES.PHARMACY, ROLES.HOSPITAL].includes(role)

  const logout = async () => {
    try {
      await signOutUser()
      clearSession()
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to sign out.')
    }
  }

  const nav = (
    <nav className="mt-8 space-y-2">
      {links.map(link => (
        <NavLink
          onClick={() => setOpen(false)}
          key={link.label}
          to={link.to}
          end={link.to.split('/').length === 2}
          className={({ isActive }) =>
            `flex items-center rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-[0_16px_30px_rgba(13,148,136,0.22)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-brand-700'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 z-30 hidden w-72 border-r border-slate-200 bg-white/90 p-5 backdrop-blur xl:block">
        <div className="rounded-[1.5rem] bg-gradient-to-br from-teal-600 to-cyan-700 p-4 text-white shadow-[0_18px_30px_rgba(15,118,110,0.24)]">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <PackageCheck />
            DrugTrack
          </Link>
          <p className="mt-2 text-xs text-teal-50">Track Every Dose. Trace Every Journey.</p>
        </div>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 md:hidden" onClick={() => setOpen(false)}>
          <aside onClick={event => event.stopPropagation()} className="h-full w-72 bg-white p-5 shadow-2xl">
            <button onClick={() => setOpen(false)} className="float-right" aria-label="Close menu">
              <X />
            </button>
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
              <PackageCheck />
              DrugTrack
            </Link>
            {nav}
          </aside>
        </div>
      )}

      <main className="xl:ml-72">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="xl:hidden" aria-label="Open menu">
              <Menu />
            </button>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">{role.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-500">{profile?.displayName || profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isBuyer && (
              <Link className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-brand-700" to={`${buyerBasePath}/cart`} aria-label="Cart">
                <ShoppingCart size={18} />
                <Badge>{cartCount}</Badge>
              </Link>
            )}
            {role === ROLES.CUSTOMER && (
              <Link className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:text-brand-700" to="/notifications" aria-label="Notifications">
                <Bell size={18} />
                <Badge>{unreadCount}</Badge>
              </Link>
            )}
            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-red-200 hover:text-red-600">
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-5 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
export const roleLinks = {
  ADMIN: [
    { label: 'Overview', to: '/admin' },
    { label: 'Users & approvals', to: '/admin/users' },
    { label: 'Categories', to: '/admin/categories' },
    { label: 'Drugs', to: '/admin/drugs' },
    { label: 'Batches', to: '/admin/batches' },
    { label: 'Inventory', to: '/admin/inventory' },
    { label: 'Orders', to: '/admin/orders' },
    { label: 'Order History', to: '/admin/history' },
    { label: 'Contact Messages', to: '/admin/contact-messages' },
    { label: 'Profile', to: '/admin/profile' },
  ],
  MANUFACTURER: [
    { label: 'Dashboard', to: '/manufacturer' },
    { label: 'My drugs', to: '/manufacturer/my-drugs' },
    { label: 'Batches', to: '/manufacturer/batches' },
    { label: 'Inventory', to: '/manufacturer/inventory' },
    { label: 'Orders', to: '/manufacturer/orders' },
    { label: 'Order History', to: '/manufacturer/history' },
    { label: 'Profile', to: '/manufacturer/profile' },
  ],
  WAREHOUSE_MANAGER: [
    { label: 'Dashboard', to: '/warehouse' },
    { label: 'Inventory', to: '/warehouse/inventory' },
    { label: 'Profile', to: '/warehouse/profile' },
  ],
  DISTRIBUTOR: [
    { label: 'Dashboard', to: '/distributor' },
    { label: 'Inventory', to: '/distributor/inventory' },
    { label: 'Orders', to: '/distributor/orders' },
    { label: 'Order History', to: '/distributor/history' },
    { label: 'Profile', to: '/distributor/profile' },
  ],
  PHARMACY: [
    { label: 'Dashboard', to: '/pharmacy' },
    { label: 'Order Medicines', to: '/pharmacy/order' },
    { label: 'My Purchases', to: '/pharmacy/purchases' },
    { label: 'Order History', to: '/pharmacy/history' },
    { label: 'Saved Addresses', to: '/pharmacy/addresses' },
    { label: 'Inventory', to: '/pharmacy/my-inventory' },
    { label: 'Customer Orders', to: '/pharmacy/orders' },
    { label: 'Profile', to: '/pharmacy/profile' },
  ],
  HOSPITAL: [
    { label: 'Dashboard', to: '/hospital' },
    { label: 'Order Medicines', to: '/hospital/order' },
    { label: 'My Purchases', to: '/hospital/purchases' },
    { label: 'Order History', to: '/hospital/history' },
    { label: 'Saved Addresses', to: '/hospital/addresses' },
    { label: 'Inventory', to: '/hospital/inventory' },
    { label: 'Hospital Orders', to: '/hospital/orders' },
    { label: 'Profile', to: '/hospital/profile' },
  ],
  DELIVERY_STAFF: [{ label: 'Dashboard', to: '/delivery' }, { label: 'Profile', to: '/delivery/profile' }],
  CUSTOMER: [
    { label: 'Home', to: '/shop' },
    { label: 'Medicines', to: '/medicines' },
    { label: 'Cart', to: '/cart' },
    { label: 'Orders', to: '/orders' },
    { label: 'History', to: '/history' },
    { label: 'Addresses', to: '/addresses' },
    { label: 'Notifications', to: '/notifications' },
    { label: 'Profile', to: '/profile' },
  ],
}
