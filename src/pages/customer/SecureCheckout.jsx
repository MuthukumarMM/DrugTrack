import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
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
  fullName: 'Full name',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  state: 'State',
  postalCode: 'Postal code',
  country: 'Country',
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

  useEffect(() => subscribeCart(currentUser.uid, setCart), [currentUser])
  useEffect(() => subscribeAddresses(currentUser.uid, setAddresses), [currentUser])

  useEffect(() => {
    if (!addresses?.length || selectedAddressId) return
    const defaultAddress = addresses.find(item => item.isDefault) || addresses[0]
    setSelectedAddressId(defaultAddress.id)
    setAddress({ ...blankAddress, ...defaultAddress })
  }, [addresses, selectedAddressId])

  const items = cart?.items || []
  const estimatedTotal = useMemo(() => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0), [items])

  if (!cart || !addresses) return <LoadingSpinner />

  if (!items.length) {
    return <EmptyState title="Your cart is empty" description="Add verified medicines before checkout." />
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
    setBusy(true)
    try {
      const result = await createTrustedOrder({ address, paymentMethod: 'CASH_ON_DELIVERY' })
      toast.success('Order placed. Stock reserved.')
      navigate(`/orders/${result.orderId}`, { replace: true })
    } catch (error) {
      toast.error(error.message || 'Unable to place order.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <PageHeader title="Secure checkout" description="Cash on Delivery is a demo method. Stock and totals are trusted server-side." />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <div className="panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Delivery address</h2>
            {addresses.length ? (
              <select className="field mt-4 bg-white" value={selectedAddressId} onChange={chooseAddress}>
                {addresses.map(item => (
                  <option value={item.id} key={item.id}>
                    {item.fullName} - {item.city}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No saved address yet. This checkout address will be sent to the trusted order Function.
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(labels).map(([name, label]) => (
                <input
                  key={name}
                  className="field"
                  name={name}
                  required={name !== 'addressLine2'}
                  placeholder={label}
                  value={address[name] || ''}
                  onChange={updateAddress}
                />
              ))}
            </div>
            <Link className="mt-4 inline-block text-sm font-semibold text-brand-700" to="/addresses">
              Manage saved addresses
            </Link>
          </div>

          <div className="panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Payment method</h2>
            <label className="mt-4 flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950">
              <input type="radio" checked readOnly />
              Cash on Delivery / Demo Payment
            </label>
          </div>
        </section>

        <aside className="panel h-fit p-5">
          <h2 className="text-lg font-bold text-slate-950">Order summary</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {items.map(item => (
              <div className="py-3" key={item.inventoryId}>
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-slate-950">{item.drugName}</p>
                  <p>{money(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">Qty {item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Cart estimate</span><span>{money(estimatedTotal)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Delivery fee</span><span>Trusted by server</span></div>
            <div className="flex justify-between border-t pt-3 text-base font-bold"><span>Total</span><span>Calculated in Function</span></div>
          </div>
          <Button disabled={busy} className="mt-5 w-full">
            {busy ? 'Placing order...' : 'Place trusted order'}
          </Button>
        </aside>
      </div>
    </form>
  )
}
