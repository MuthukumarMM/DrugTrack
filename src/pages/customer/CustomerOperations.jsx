import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { markNotificationRead, subscribeNotifications } from '../../services/notificationService'
import { removeAddress, saveAddress, subscribeAddresses } from '../../services/addressService'
import { subscribeOrder, subscribeOrders } from '../../services/orderService'

const blankAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefault: false,
}

const timeline = ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']
const historyStatuses = new Set(['COMPLETED', 'CANCELLED', 'RETURNED'])

function currency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

function toDate(value) {
  if (!value) return 'Not available'
  if (typeof value.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

export function AddressesPage() {
  const { currentUser } = useAuth()
  const [rows, setRows] = useState(null)
  const [form, setForm] = useState(blankAddress)
  const [editingId, setEditingId] = useState('')

  useEffect(() => subscribeAddresses(currentUser.uid, setRows), [currentUser])

  if (!rows) return <LoadingSpinner />

  const update = event => {
    const { name, value, type, checked } = event.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const submit = async event => {
    event.preventDefault()
    try {
      await saveAddress(currentUser.uid, form, editingId || undefined)
      toast.success(editingId ? 'Address updated.' : 'Address saved.')
      setForm(blankAddress)
      setEditingId('')
    } catch (error) {
      toast.error(error.message || 'Unable to save address.')
    }
  }

  return (
    <>
      <PageHeader title="Addresses" description="Manage delivery addresses saved to your Firestore customer profile." />
      <form onSubmit={submit} className="panel grid gap-3 p-5 sm:grid-cols-2">
        {[
          ['fullName', 'Full name'],
          ['phone', 'Phone'],
          ['addressLine1', 'Address line 1'],
          ['addressLine2', 'Address line 2'],
          ['city', 'City'],
          ['state', 'State'],
          ['postalCode', 'Postal code'],
          ['country', 'Country'],
        ].map(([name, label]) => (
          <input
            key={name}
            className="field"
            name={name}
            required={name !== 'addressLine2'}
            placeholder={label}
            value={form[name]}
            onChange={update}
          />
        ))}
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={update} />
          Default delivery address
        </label>
        <button className="rounded-xl bg-brand-600 px-4 py-2 font-semibold text-white">
          {editingId ? 'Update address' : 'Save address'}
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map(address => (
          <article key={address.id} className="panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <b className="text-slate-950">{address.fullName}</b>
                {address.isDefault && <span className="ml-2 rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-brand-700">Default</span>}
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {address.addressLine1}
              {address.addressLine2 ? `, ${address.addressLine2}` : ''}, {address.city}, {address.state} {address.postalCode}
            </p>
            <p className="mt-1 text-sm text-slate-500">{address.phone}</p>
            <div className="mt-4 flex gap-4 text-sm font-semibold">
              <button
                className="text-brand-700"
                onClick={() => {
                  setEditingId(address.id)
                  setForm({ ...blankAddress, ...address })
                }}
              >
                Edit
              </button>
              <button className="text-red-600" onClick={() => removeAddress(currentUser.uid, address.id).catch(error => toast.error(error.message))}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export function OrdersPage({ history = false }) {
  const { currentUser } = useAuth()
  const [rows, setRows] = useState(null)

  useEffect(() => subscribeOrders(currentUser.uid, setRows), [currentUser])

  const visible = useMemo(() => {
    if (!rows) return []
    return history ? rows.filter(order => historyStatuses.has(order.orderStatus)) : rows.filter(order => !historyStatuses.has(order.orderStatus))
  }, [rows, history])

  if (!rows) return <LoadingSpinner />

  return (
    <>
      <PageHeader
        title={history ? 'Order history' : 'My orders'}
        description={history ? 'Completed, cancelled, and returned orders.' : 'Realtime status updates for trusted DrugTrack orders.'}
      />
      {!visible.length ? (
        <EmptyState
          title={history ? 'No order history yet' : 'No active orders yet'}
          description={history ? 'Finished orders will appear here.' : 'Browse verified medicines to place your first order.'}
        />
      ) : (
        <div className="space-y-3">
          {visible.map(order => (
            <article className="panel flex flex-wrap items-center justify-between gap-4 p-5" key={order.id}>
              <div>
                <p className="font-bold text-slate-950">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {(order.items || []).length} item(s) | {currency(order.totalAmount)} | {toDate(order.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={order.orderStatus} />
                <Link className="text-sm font-semibold text-brand-700" to={`/orders/${order.id}`}>
                  View
                </Link>
                {order.shipmentId && (
                  <Link className="text-sm font-semibold text-brand-700" to={`/track/${order.shipmentId}`}>
                    Track
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

export function OrderDetailPage() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(undefined)

  useEffect(() => subscribeOrder(orderId, setOrder), [orderId])

  if (order === undefined) return <LoadingSpinner />
  if (!order) return <EmptyState title="Order not found" description="This order is unavailable or you do not have access." />

  const currentIndex = timeline.indexOf(order.orderStatus)

  return (
    <>
      <PageHeader title={order.orderNumber || 'Order details'} description="Realtime order status, delivery address, items, and shipment access." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="panel p-5">
          <h2 className="text-lg font-bold text-slate-950">Items</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {(order.items || []).map(item => (
              <div className="flex items-center justify-between gap-4 py-4" key={`${item.drugId}-${item.batchId}`}>
                <div>
                  <p className="font-semibold text-slate-950">{item.drugName}</p>
                  <p className="mt-1 text-sm text-slate-500">Qty {item.quantity} | Batch {item.batchId}</p>
                </div>
                <p className="font-bold">{currency(item.total || item.quantity * item.unitPrice)}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Order status</dt><dd><StatusBadge status={order.orderStatus} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Payment</dt><dd className="font-semibold">{order.paymentStatus}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{currency(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{currency(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{currency(order.totalAmount)}</dd></div>
            </dl>
            {order.shipmentId && (
              <Link className="mt-5 block rounded-xl bg-brand-600 px-4 py-2.5 text-center font-semibold text-white" to={`/track/${order.shipmentId}`}>
                Track shipment
              </Link>
            )}
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Delivery address</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {order.deliveryAddress?.fullName}<br />
              {order.deliveryAddress?.addressLine1}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{' '}
              {order.deliveryAddress?.postalCode}
            </p>
          </section>
        </aside>
      </div>

      <section className="panel mt-5 p-5">
        <h2 className="text-lg font-bold text-slate-950">Order timeline</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          {timeline.map((status, index) => (
            <div className={`rounded-2xl border p-3 ${index <= currentIndex ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`} key={status}>
              <p className={`text-sm font-bold ${index <= currentIndex ? 'text-brand-700' : 'text-slate-400'}`}>{status.replaceAll('_', ' ')}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export function NotificationsPage() {
  const { currentUser } = useAuth()
  const [rows, setRows] = useState(null)

  useEffect(() => subscribeNotifications(currentUser.uid, setRows), [currentUser])

  if (!rows) return <LoadingSpinner />

  return (
    <>
      <PageHeader title="Notifications" description="Realtime operational and order updates." />
      {!rows.length ? (
        <EmptyState title="You are all caught up" description="New notifications will appear here automatically." />
      ) : (
        <div className="space-y-3">
          {rows.map(notification => (
            <button
              key={notification.id}
              onClick={() => markNotificationRead(notification.id).catch(error => toast.error(error.message))}
              className={`panel block w-full p-5 text-left ${notification.isRead ? 'opacity-70' : 'border-teal-200'}`}
            >
              <b className="text-slate-950">{notification.title}</b>
              <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
