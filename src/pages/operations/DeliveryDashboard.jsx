import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { subscribeAssignedShipments } from '../../services/shipmentService'
import { updateTrustedShipmentStatus } from '../../services/functionsService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/feedback/EmptyState'
export default function DeliveryDashboard() {
	const { currentUser } = useAuth()
	const [rows, setRows] = useState(null)
	const [form, setForm] = useState({})
	useEffect(() => subscribeAssignedShipments(currentUser.uid, setRows), [currentUser])
	if (!rows) return <LoadingSpinner />
	const update = async (shipment, override = {}) => {
		const values = { ...(form[shipment.id] || {}), ...override }
		try {
			await updateTrustedShipmentStatus({ shipmentId: shipment.id, status: values.status || shipment.status, latitude: values.latitude, longitude: values.longitude, message: values.message })
			toast.success('Shipment updated.')
		} catch (error) { toast.error(error.message || 'Unable to update shipment.') }
	}
	return <><PageHeader title="Assigned deliveries" description="Update the connected shipment lifecycle. Coordinates are explicitly marked simulated when applicable." />{!rows.length ? <EmptyState title="No assigned deliveries" description="Assigned shipments will appear here in real time." /> : <div className="grid gap-4">{rows.map(shipment => { const next = { ASSIGNED: 'ACCEPTED', ACCEPTED: 'PICKED_UP', PICKED_UP: 'IN_TRANSIT', IN_TRANSIT: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED' }[shipment.status]; return <article className="panel p-5" key={shipment.id}><div className="flex flex-wrap justify-between gap-3"><div><b>{shipment.shipmentNumber}</b><p className="mt-1 text-sm text-slate-500">{shipment.recipient?.fullName || shipment.recipient?.addressLine1 || 'Recipient address unavailable'}</p><p className="mt-1 text-sm text-slate-500">Order: {shipment.orderNumber || shipment.orderId}</p></div><div className="text-right"><p className="font-semibold">{shipment.status}</p><p className="text-sm text-slate-500">ETA: {shipment.estimatedDelivery || 'Not set'}</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><input className="field" type="number" step="any" placeholder="Latitude" value={form[shipment.id]?.latitude || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...form[shipment.id], latitude: event.target.value } })} /><input className="field" type="number" step="any" placeholder="Longitude" value={form[shipment.id]?.longitude || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...form[shipment.id], longitude: event.target.value } })} /><input className="field" placeholder="Delivery note" value={form[shipment.id]?.message || ''} onChange={event => setForm({ ...form, [shipment.id]: { ...form[shipment.id], message: event.target.value } })} /></div><div className="mt-4 flex flex-wrap items-center gap-3">{next && <button onClick={() => update(shipment, { status: next })} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white">{next.replaceAll('_', ' ')}</button>}<button onClick={() => update(shipment)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Update location</button>{shipment.simulatedGps && <span className="text-xs font-semibold text-amber-700">SIMULATED GPS / DEMO TRACKING</span>}</div></article> })}</div>}</>
}
