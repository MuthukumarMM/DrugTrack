import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { markNotificationRead, subscribeNotifications } from '../../services/notificationService'
import { removeAddress, saveAddress, subscribeAddresses } from '../../services/addressService'
import { subscribeOrder, subscribeOrders } from '../../services/orderService'
import { subscribeShipment } from '../../services/shipmentService'
import { confirmTrustedDelivery, createTrustedReview } from '../../services/functionsService'
import HistoryStats from '../../components/common/HistoryStats'

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

const timeline = [
  { status: 'PENDING', owner: 'Buyer', label: 'Order placed' },
  { status: 'UNDER_REVIEW', owner: 'Manufacturer', label: 'Under review' },
  { status: 'APPROVED', owner: 'Manufacturer', label: 'Approved' },
  { status: 'PROCESSING', owner: 'Manufacturer', label: 'Processing' },
  { status: 'PACKED', owner: 'Manufacturer', label: 'Packed' },
  { status: 'READY_FOR_DISTRIBUTOR', owner: 'Manufacturer', label: 'Ready for distributor' },
  { status: 'DISTRIBUTOR_RECEIVED', owner: 'Distributor', label: 'Accepted' },
  { status: 'DISTRIBUTOR_PROCESSING', owner: 'Distributor', label: 'Processing' },
  { status: 'READY_FOR_DELIVERY', owner: 'Distributor', label: 'Ready for delivery' },
  { status: 'PICKED_UP', owner: 'Delivery staff', label: 'Picked up' },
  { status: 'IN_TRANSIT', owner: 'Delivery staff', label: 'In transit' },
  { status: 'OUT_FOR_DELIVERY', owner: 'Delivery staff', label: 'Out for delivery' },
  { status: 'DELIVERED', owner: 'Recipient', label: 'Delivered' },
  { status: 'RECIPIENT_CONFIRMED', owner: 'Recipient', label: 'Confirmed' },
  { status: 'COMPLETED', owner: 'Recipient', label: 'Rated and completed' },
]
const historyStatuses = new Set(['COMPLETED', 'CANCELLED', 'REJECTED'])

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
  const { currentUser, role } = useAuth()
  const [rows, setRows] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => subscribeOrders(currentUser.uid, setRows), [currentUser])

  const visible = useMemo(() => {
    if (!rows) return []
    const baseRows = history ? rows : rows.filter(order => !historyStatuses.has(order.orderStatus))
    const term = search.trim().toLowerCase()
    return baseRows.filter(order => {
      const matchesSearch = !term || `${order.orderNumber} ${order.orderStatus} ${(order.items || []).map(item => item.drugName).join(' ')}`.toLowerCase().includes(term)
      return matchesSearch && (statusFilter === 'ALL' || order.orderStatus === statusFilter)
    })
  }, [rows, history, search, statusFilter])

  if (!rows) return <LoadingSpinner />

  const buyerBasePath = role === 'PHARMACY' ? '/pharmacy' : role === 'HOSPITAL' ? '/hospital' : ''

  return (
    <>
      <PageHeader
        title={history ? 'Complete purchase history' : 'My orders'}
        description={history ? 'A complete ledger of every order, approval, delivery, cancellation, and review.' : 'Realtime status updates for trusted DrugTrack orders.'}
      />
      {history && <HistoryStats orders={rows} title="Purchase history summary" />}
      {history && (
        <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_220px]">
          <input aria-label="Search order number or medicine" className="field bg-white" placeholder="Search order number or medicine" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="field bg-white" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'PACKED', 'READY_FOR_DISTRIBUTOR', 'DISTRIBUTOR_RECEIVED', 'DISTRIBUTOR_PROCESSING', 'READY_FOR_DELIVERY', 'DELIVERED', 'RECIPIENT_CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED'].map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
          </select>
        </div>
      )}
      {!visible.length ? (
        <EmptyState
          title={history ? 'No orders match this history view' : 'No active orders yet'}
          description={history ? 'Placed orders will remain available here with their complete status trail.' : 'Browse verified medicines to place your first order.'}
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
                <Link className="text-sm font-semibold text-brand-700" to={`${buyerBasePath}/orders/${order.id}`}>
                  View
                </Link>
                {order.shipmentId && (
                  <Link className="text-sm font-semibold text-brand-700" to={`${buyerBasePath}/track/${order.shipmentId}`}>
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
  const { role } = useAuth()
  const [order, setOrder] = useState(undefined)
  const [shipment, setShipment] = useState(null)
  const [review, setReview] = useState({ deliveryRating: 5, serviceRating: 5, comment: '' })
  const [busy, setBusy] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => subscribeOrder(orderId, setOrder), [orderId])
  useEffect(() => {
    if (!order?.shipmentId) return undefined
    return subscribeShipment(order.shipmentId, setShipment)
  }, [order?.shipmentId])
  useEffect(() => {
    if (order?.orderStatus === 'COMPLETED') setShowCelebration(true)
  }, [order?.orderStatus])

  if (order === undefined) return <LoadingSpinner />
  if (!order) return <EmptyState title="Order not found" description="This order is unavailable or you do not have access." />

  const buyerBasePath = role === 'PHARMACY' ? '/pharmacy' : role === 'HOSPITAL' ? '/hospital' : ''

  const shipmentOrderStatus = {
    ASSIGNED: 'READY_FOR_DELIVERY',
    ACCEPTED: 'READY_FOR_DELIVERY',
    PICKED_UP: 'PICKED_UP',
    IN_TRANSIT: 'IN_TRANSIT',
    OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
    DELIVERED: 'DELIVERED',
  }
  const displayStatus = shipmentOrderStatus[shipment?.status] || order.orderStatus
  const currentIndex = timeline.findIndex(step => step.status === displayStatus)
  const confirmReceipt = async () => {
    setBusy(true)
    try { await confirmTrustedDelivery(order.id); toast.success('Receipt confirmed.') } catch (error) { toast.error(error.message || 'Unable to confirm receipt.') } finally { setBusy(false) }
  }
  const submitReview = async event => {
    event.preventDefault()
    setBusy(true)
    try { await createTrustedReview({ orderId: order.id, shipmentId: order.shipmentId, ...review }); toast.success('Thank you for your review.') } catch (error) { toast.error(error.message || 'Unable to submit review.') } finally { setBusy(false) }
  }

  return (
    <>
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5" role="dialog" aria-modal="true" aria-label="Order completed">
          <div className="celebration-confetti" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => <span key={index} style={{ '--confetti-index': index }} />)}
          </div>
          <div className="w-full max-w-md rounded-3xl border border-teal-100 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-teal-700">
              <PartyPopper size={32} />
            </div>
            <p className="mt-5 text-3xl" aria-hidden="true">🎉</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Order completed</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Thank you for confirming delivery and sharing your review. This order is now part of your complete history.</p>
            <button type="button" onClick={() => setShowCelebration(false)} className="mt-6 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">Continue</button>
          </div>
        </div>
      )}
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
              <div className="flex justify-between"><dt className="text-slate-500">Order status</dt><dd><StatusBadge status={displayStatus} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Payment</dt><dd className="font-semibold">{order.paymentStatus}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{currency(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{currency(order.deliveryFee)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{currency(order.totalAmount)}</dd></div>
            </dl>
            {order.shipmentId && (
              <Link className="mt-5 block rounded-xl bg-brand-600 px-4 py-2.5 text-center font-semibold text-white" to={`${buyerBasePath}/track/${order.shipmentId}`}>
                Track shipment
              </Link>
            )}
            {order.orderStatus === 'DELIVERED' && <button disabled={busy} onClick={confirmReceipt} className="mt-3 block w-full rounded-xl border border-teal-200 px-4 py-2.5 text-center font-semibold text-brand-700">Confirm receipt</button>}
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
          {timeline.map((step, index) => (
            <div className={`rounded-2xl border p-3 transition ${index <= currentIndex ? 'border-teal-200 bg-teal-50 shadow-sm' : 'border-slate-200 bg-white'}`} key={step.status}>
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${index <= currentIndex ? 'text-teal-700' : 'text-slate-400'}`}>{step.owner}</p>
              <p className={`mt-1 text-sm font-bold ${index <= currentIndex ? 'text-brand-700' : 'text-slate-400'}`}>{step.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="panel mt-5 p-5">
        <h2 className="text-lg font-bold text-slate-950">Live approval history</h2>
        <p className="mt-1 text-sm text-slate-500">Every operational handoff is recorded as the order moves from manufacturer to recipient.</p>
        {!order.orderHistory?.length ? (
          <p className="mt-4 text-sm text-slate-400">History will appear after the first workflow update.</p>
        ) : (
          <ol className="mt-5 space-y-4 border-l-2 border-teal-100 pl-5">
            {[...order.orderHistory].reverse().map((event, index) => (
              <li key={`${event.status}-${event.at}-${index}`} className="relative">
                <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-teal-600 shadow-sm" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-900">{event.status.replaceAll('_', ' ')}</p>
                  <time className="text-xs text-slate-400">{toDate(event.at)}</time>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.message}</p>
                {event.actorRole && <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-teal-700">{event.actorRole.replaceAll('_', ' ')}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
      {order.orderStatus === 'RECIPIENT_CONFIRMED' && (
        <form onSubmit={submitReview} className="panel mt-5 grid gap-3 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold text-slate-950 sm:col-span-2">Rate this delivery</h2>
          <label className="text-sm font-semibold">Delivery rating<select className="field mt-1 w-full" value={review.deliveryRating} onChange={event => setReview({ ...review, deliveryRating: event.target.value })}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <label className="text-sm font-semibold">Order service rating<select className="field mt-1 w-full" value={review.serviceRating} onChange={event => setReview({ ...review, serviceRating: event.target.value })}>{[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <textarea className="field min-h-24 sm:col-span-2" placeholder="Write a review" value={review.comment} onChange={event => setReview({ ...review, comment: event.target.value })} />
          <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white sm:col-span-2">Submit review</button>
        </form>
      )}
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
