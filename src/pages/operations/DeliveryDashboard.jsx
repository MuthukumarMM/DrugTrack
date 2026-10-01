import { useEffect, useMemo, useState } from 'react'
import { Star, Truck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { subscribeAssignedShipments } from '../../services/shipmentService'
import { subscribeShipmentReviews } from '../../services/reviewService'
import { updateTrustedShipmentStatus } from '../../services/functionsService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/feedback/EmptyState'
import StatusBadge from '../../components/common/StatusBadge'

const nextStatus = {
  ASSIGNED: 'ACCEPTED',
  ACCEPTED: 'PICKED_UP',
  PICKED_UP: 'IN_TRANSIT',
  IN_TRANSIT: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
}

export default function DeliveryDashboard() {
  const { currentUser } = useAuth()
  const [shipments, setShipments] = useState(null)
  const [reviews, setReviews] = useState([])
  const [form, setForm] = useState({})

  useEffect(() => subscribeAssignedShipments(currentUser.uid, setShipments), [currentUser])
  useEffect(() => subscribeShipmentReviews((shipments || []).map(shipment => shipment.id), setReviews), [shipments])

  const reviewsByShipment = useMemo(() => new Map(reviews.map(review => [review.shipmentId, review])), [reviews])

  if (!shipments) return <LoadingSpinner />

  const update = async (shipment, status) => {
    const values = { ...(form[shipment.id] || {}), status }
    try {
      await updateTrustedShipmentStatus({
        shipmentId: shipment.id,
        status,
        latitude: values.latitude,
        longitude: values.longitude,
        message: values.message,
      })
      toast.success('Shipment updated.')
    } catch (error) {
      toast.error(error.message || 'Unable to update shipment.')
    }
  }

  return (
    <>
      <PageHeader title="Assigned deliveries" description="Move each medicine shipment through the live route and review buyer feedback after delivery." />
      {!shipments.length ? (
        <EmptyState title="No assigned deliveries" description="Assigned shipments will appear here in real time." />
      ) : (
        <div className="grid gap-4">
          {shipments.map(shipment => {
            const review = reviewsByShipment.get(shipment.id)
            const next = nextStatus[shipment.status]
            const values = form[shipment.id] || {}
            return (
              <article className="panel p-5" key={shipment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{shipment.shipmentNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">Order: {shipment.orderNumber || shipment.orderId}</p>
                    <p className="mt-1 text-sm text-slate-500">Recipient: {shipment.recipient?.fullName || shipment.recipient?.addressLine1 || 'Address unavailable'}</p>
                  </div>
                  <div className="text-right"><StatusBadge status={shipment.status} /><p className="mt-1 text-xs text-slate-500">ETA: {shipment.estimatedDelivery || 'Not set'}</p></div>
                </div>

                {review && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-amber-950"><Star size={16} className="fill-amber-400 text-amber-500" /> Buyer feedback</div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-amber-900">
                      <span>Delivery: {review.deliveryRating}/5</span>
                      <span>Service: {review.serviceRating}/5</span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm italic text-amber-950">“{review.comment}”</p>}
                  </div>
                )}

                {next && <>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <input aria-label="Live latitude" className="field" type="number" step="any" placeholder="Live latitude" value={values.latitude || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...values, latitude: event.target.value } })} />
                    <input aria-label="Live longitude" className="field" type="number" step="any" placeholder="Live longitude" value={values.longitude || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...values, longitude: event.target.value } })} />
                    <input aria-label="Delivery note" className="field" placeholder="Delivery note" value={values.message || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...values, message: event.target.value } })} />
                  </div>
                  <button onClick={() => update(shipment, next)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"><Truck size={16} /> Mark {next.replaceAll('_', ' ').toLowerCase()}</button>
                </>}
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
