import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Clock, MapPin, Navigation, PackageCheck, ShieldCheck, Truck } from 'lucide-react'
import L from 'leaflet'
import { subscribeShipment, subscribeTrackingEvents } from '../../services/shipmentService'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'

// Fix default leaflet marker icon in bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function formatDateTime(val) {
  if (!val) return '—'
  if (typeof val.toDate === 'function') return val.toDate().toLocaleString()
  return new Date(val).toLocaleString()
}

export default function TrackingMap() {
  const { shipmentId } = useParams()
  const [shipment, setShipment] = useState(undefined)
  const [events, setEvents] = useState([])

  useEffect(() => {
    return subscribeShipment(shipmentId, setShipment)
  }, [shipmentId])

  useEffect(() => {
    return subscribeTrackingEvents(shipmentId, setEvents)
  }, [shipmentId])

  if (shipment === undefined) return <LoadingSpinner />

  if (!shipment) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Shipment Tracking"
          description="Live transit updates for medical supply shipments."
        />
        <div className="panel p-10 text-center">
          <Truck className="mx-auto text-slate-400" size={48} />
          <h2 className="mt-4 text-lg font-bold text-slate-900">Shipment record not found</h2>
          <p className="mt-2 text-sm text-slate-500">
            The tracking number or shipment ID provided is invalid or has expired.
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <ArrowLeft size={16} />
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const lat = Number(shipment.currentLatitude)
  const lng = Number(shipment.currentLongitude)
  const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 mb-2"
          >
            <ArrowLeft size={14} />
            Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <span>{shipment.shipmentNumber || shipment.id}</span>
            <StatusBadge status={shipment.status} />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Carrier: <span className="font-semibold text-slate-700">{shipment.carrierName || 'DrugTrack Logistics Fleet'}</span>
            {shipment.trackingNumber && ` • Tracking: ${shipment.trackingNumber}`}
          </p>
        </div>

        <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-right">
          <span className="text-xs font-medium text-teal-800 flex items-center gap-1 sm:justify-end">
            <Clock size={13} />
            Estimated Delivery
          </span>
          <p className="text-sm font-bold text-teal-950 mt-0.5">
            {shipment.estimatedDelivery || 'In Transit'}
          </p>
        </div>
      </div>

      {/* Main content grid: Map on left, Tracking events timeline on right */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Map Container */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Navigation size={14} className="text-teal-600" />
                Live GPS Transit Map
              </span>
              <span className="text-xs text-slate-500">
                OpenStreetMap Realtime Telemetry
              </span>
            </div>

            {hasCoordinates ? (
              <div className="h-96 w-full">
                <MapContainer
                  center={[lat, lng]}
                  zoom={13}
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[lat, lng]}>
                    <Popup>
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{shipment.shipmentNumber}</p>
                        <p className="text-slate-600 mt-1">Status: {shipment.status}</p>
                        <p className="text-teal-700 mt-0.5 font-semibold">Live Courier Position</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : (
              <div className="flex h-96 flex-col items-center justify-center p-6 text-center text-slate-500">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <MapPin size={24} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">Coordinates Awaiting Dispatch</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  The delivery courier has not transmitted live telemetry yet. Real-time GPS markers appear once out for delivery.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck size={18} className="shrink-0 text-teal-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">Cold Chain & Integrity Assured</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                All DrugTrack medical dispatches are logged to immutable Firestore shipment logs. Drivers verify deliveries with one-time handoff credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PackageCheck size={18} className="text-teal-600" />
              Tracking Activity Logs
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Complete chronological audit trail for this consignment.
            </p>

            {events.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No tracking checkpoints recorded yet.
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <ul className="-mb-8">
                  {events.map((event, eventIdx) => (
                    <li key={event.id || eventIdx}>
                      <div className="relative pb-8">
                        {eventIdx !== events.length - 1 ? (
                          <span
                            className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3 items-start">
                          <div>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 ring-4 ring-white text-teal-600">
                              <Truck size={14} />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-900">
                                {event.status || 'CHECKPOINT'}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDateTime(event.timestamp)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600 leading-normal">
                              {event.message || event.notes || 'Package status updated.'}
                            </p>
                            {event.locationName && (
                              <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                Location: {event.locationName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
