import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import { useAuth } from '../../context/AuthContext'
import { subscribeAddresses } from '../../services/addressService'
import { subscribeCart } from '../../services/cartService'
import { createTrustedOrder } from '../../services/functionsService'

const blankAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
}

const labels = {
  fullName: 'Full Name *',
  phone: 'Mobile Number *',
  addressLine1: 'Flat / House No., Street *',
  addressLine2: 'Landmark / Area (Optional)',
  city: 'City *',
  state: 'State *',
  postalCode: 'PIN Code *',
  country: 'Country *',
}

function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

export default function SecureCheckout() {
  const { currentUser } = useAuth()
  const [cart, setCart] = useState(null)
  const [addresses, setAddresses] = useState(null)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [address, setAddress] = useState(blankAddress)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) return undefined
    return subscribeCart(currentUser.uid, setCart)
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return undefined
    return subscribeAddresses(currentUser.uid, fetched => {
      setAddresses(fetched)
      if (fetched && fetched.length > 0) {
        setSelectedAddressId(prev => {
          if (prev) return prev
          const def = fetched.find(a => a.isDefault) || fetched[0]
          setAddress({ ...blankAddress, ...def })
          return def.id
        })
      }
    })
  }, [currentUser])

  const items = useMemo(() => cart?.items || [], [cart?.items])
  const itemsSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
    [items]
  )
  const estimatedShipping = itemsSubtotal > 500 || itemsSubtotal === 0 ? 0 : 40
  const estimatedTotal = itemsSubtotal + estimatedShipping

  if (!cart || !addresses) return <LoadingSpinner />

  if (!items.length) {
    return (
      <div className="space-y-6">
        <PageHeader title="Checkout" description="Order certified medicines from verified suppliers." />
        <EmptyState
          title="Your shopping cart is empty"
          description="Browse the verified medicine marketplace to add items before checking out."
        />
        <div className="text-center">
          <Link
            to="/shop"
            className="inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-teal-700 transition"
          >
            Explore Catalogue
          </Link>
        </div>
      </div>
    )
  }

  const chooseAddress = event => {
    const id = event.target.value
    setSelectedAddressId(id)
    const selected = addresses.find(item => item.id === id)
    setAddress(selected ? { ...blankAddress, ...selected } : blankAddress)
  }

  const updateAddress = event => setAddress({ ...address, [event.target.name]: event.target.value })

  const submit = async event => {
    event.preventDefault()
    if (!address.fullName.trim() || !address.phone.trim() || !address.addressLine1.trim() || !address.city.trim() || !address.postalCode.trim()) {
      toast.error('Please fill in all required address fields.')
      return
    }

    setBusy(true)
    try {
      const result = await createTrustedOrder({ address, paymentMethod: 'CASH_ON_DELIVERY' })
      toast.success('Order placed successfully! Stock reserved.')
      navigate(`/orders/${result.orderId}`, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to place order. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        title="Secure Checkout"
        description="Verify delivery location and review your pharmaceutical order details."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Address and Payment */}
        <section className="space-y-6">
          {/* Address Section */}
          <div className="panel p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-teal-600" />
                Delivery Address
              </h2>
              <Link
                to="/addresses"
                className="text-xs font-semibold text-teal-700 hover:text-teal-800"
              >
                + Manage Saved
              </Link>
            </div>

            {addresses.length > 0 ? (
              <div className="mt-4">
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Select from saved addresses:
                </label>
                <select
                  className="field w-full bg-white text-sm"
                  value={selectedAddressId}
                  onChange={chooseAddress}
                >
                  {addresses.map(item => (
                    <option value={item.id} key={item.id}>
                      {item.fullName} — {item.addressLine1}, {item.city} ({item.postalCode}) {item.isDefault ? ' [Default]' : ''}
                    </option>
                  ))}
                  <option value="">Use custom address below</option>
                </select>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                You have no saved addresses. Complete the shipping form below.
              </p>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.entries(labels).map(([name, label]) => (
                <div key={name} className={name === 'addressLine1' || name === 'addressLine2' ? 'sm:col-span-2' : ''}>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    {label}
                  </label>
                  <input
                    className="field w-full text-sm"
                    name={name}
                    required={name !== 'addressLine2'}
                    placeholder={label.replace(' *', '')}
                    value={address[name] || ''}
                    onChange={updateAddress}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="panel p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard size={18} className="text-teal-600" />
              Payment Method
            </h2>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-2xl border-2 border-teal-600 bg-teal-50/50 p-4 cursor-pointer transition">
                <input
                  type="radio"
                  name="payment"
                  checked
                  readOnly
                  className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <p className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <span>Pay On Delivery / Certified Receipt</span>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase">
                      Recommended
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-teal-800/80 leading-relaxed">
                    Verify physical seals, QR codes, and tamper-evident packaging with the courier upon handoff before completing payment.
                  </p>
                </div>
              </label>

              <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                <ShieldCheck size={16} className="text-teal-600 shrink-0" />
                <span>All transactions are protected by DrugTrack tamper-proof audit trails.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Order Summary */}
        <aside className="space-y-4">
          <div className="panel p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Package size={18} className="text-teal-600" />
              Order Summary ({items.length} item{items.length === 1 ? '' : 's'})
            </h2>

            <div className="mt-4 divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1">
              {items.map(item => (
                <div className="py-3 flex items-center justify-between gap-3 text-xs" key={item.inventoryId}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 truncate">{item.drugName}</p>
                    <p className="text-slate-500 mt-0.5">
                      Qty {item.quantity} × {money(item.unitPrice)}
                    </p>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">
                    {money(Number(item.unitPrice || 0) * Number(item.quantity || 0))}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-medium text-slate-900">{money(itemsSubtotal)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck size={13} />
                  Cold-Chain Logistics
                </span>
                <span className="font-medium text-slate-900">
                  {estimatedShipping === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE</span>
                  ) : (
                    money(estimatedShipping)
                  )}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-base text-teal-800">{money(estimatedTotal)}</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="mt-5 w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Securing Order...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Place Certified Order ({money(estimatedTotal)})
                </>
              )}
            </Button>

            <p className="mt-2 text-[11px] text-center text-slate-400">
              By placing your order, you agree to verified pharmaceutical storage and transport terms.
            </p>
          </div>
        </aside>
      </div>
    </form>
  )
}
