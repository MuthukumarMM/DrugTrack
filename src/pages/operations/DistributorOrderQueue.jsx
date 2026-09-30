import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { subscribeOrders } from '../../services/orderService'
import { assignTrustedShipment, createTrustedShipment, updateTrustedOrderStatus } from '../../services/functionsService'
import { demoAccounts } from '../../data/demoAccounts'
import { where } from 'firebase/firestore'
import { subscribeRecords } from '../../services/firestoreCrud'

const actions = {
  READY_FOR_DISTRIBUTOR: 'DISTRIBUTOR_RECEIVED',
  DISTRIBUTOR_RECEIVED: 'DISTRIBUTOR_ACCEPTED',
  DISTRIBUTOR_ACCEPTED: 'DISTRIBUTOR_PROCESSING',
  DISTRIBUTOR_PROCESSING: 'READY_FOR_DELIVERY',
}

const deliveryStaff = demoAccounts.filter(account => account.role === ROLES.DELIVERY_STAFF)

function currency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

export default function DistributorOrderQueue() {
  const { currentUser, role } = useAuth()
  const [orders, setOrders] = useState(null)
  const [staffRows, setStaffRows] = useState([])
  const [busyId, setBusyId] = useState('')
  const [staff, setStaff] = useState(deliveryStaff[0]?.uid || '')

  useEffect(() => subscribeOrders(currentUser.uid, setOrders, true, 'distributorId'), [currentUser])
  useEffect(() => subscribeRecords('users', setStaffRows, [where('role', '==', ROLES.DELIVERY_STAFF)]), [])
  useEffect(() => {
    const firstStaff = staffRows.find(person => person.role === ROLES.DELIVERY_STAFF)
    if (firstStaff?.uid || firstStaff?.id) setStaff(firstStaff.uid || firstStaff.id)
  }, [staffRows])

  const visible = useMemo(() => (orders || []).filter(order => !['REJECTED', 'CANCELLED', 'COMPLETED'].includes(order.orderStatus)), [orders])
  const staffOptions = (staffRows.length ? staffRows : deliveryStaff).filter(person => person.role === ROLES.DELIVERY_STAFF)

  const transition = async (order, status) => {
    setBusyId(order.id)
    try {
      await updateTrustedOrderStatus({ orderId: order.id, status, actorId: currentUser.uid, actorRole: role })
      toast.success(`Order moved to ${status.replaceAll('_', ' ').toLowerCase()}.`)
    } catch (error) {
      toast.error(error.message || 'Unable to update order.')
    } finally {
      setBusyId('')
    }
  }

  const reject = async order => {
    const rejectionReason = window.prompt('Why is the distributor rejecting this order?')?.trim()
    if (!rejectionReason) return
    setBusyId(order.id)
    try {
      await updateTrustedOrderStatus({ orderId: order.id, status: 'REJECTED', rejectionReason, validationReason: 'DISTRIBUTOR_STOCK_CHECK_FAILED', actorId: currentUser.uid, actorRole: role })
      toast.success('Order rejected and buyer notified.')
    } catch (error) {
      toast.error(error.message || 'Unable to reject order.')
    } finally {
      setBusyId('')
    }
  }

  const prepareShipment = async order => {
    setBusyId(order.id)
    try {
      const shipment = await createTrustedShipment({ orderId: order.id, carrierName: 'DrugTrack Logistics' })
      await assignTrustedShipment({ shipmentId: shipment.shipmentId, deliveryStaffId: staff })
      toast.success('Shipment created and delivery staff assigned.')
    } catch (error) {
      toast.error(error.message || 'Unable to prepare shipment.')
    } finally {
      setBusyId('')
    }
  }

  if (!orders) return <LoadingSpinner />

  return (
    <>
      <PageHeader title="Incoming distributor orders" description="Process the same Firestore orders released by manufacturers and prepare them for delivery." />
      {!visible.length ? (
        <EmptyState title="No distributor orders" description="Orders released by a manufacturer will appear here." />
      ) : (
        <div className="space-y-4">
          {visible.map(order => {
            const action = actions[order.orderStatus]
            return (
              <article className="panel p-5" key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-950">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">Buyer: {order.buyerName || order.customerName || order.customerId} | {order.buyerRole || 'CUSTOMER'}</p>
                    <p className="mt-1 text-sm text-slate-500">Destination: {order.deliveryAddress?.city || order.deliveryAddress?.addressLine1 || 'Not provided'}</p>
                  </div>
                  <div className="text-right"><StatusBadge status={order.orderStatus} /><p className="mt-2 font-bold">{currency(order.totalAmount)}</p></div>
                </div>
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  {(order.items || []).map(item => <div className="flex flex-wrap justify-between gap-3" key={`${item.inventoryId}-${item.batchId}`}><span>{item.drugName} x{item.quantity}</span><span>Batch {item.batchId || 'n/a'} | Rs. {Number(item.unitPrice || 0).toFixed(2)}</span></div>)}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {action && <Button disabled={busyId === order.id} className="!px-3 !py-1.5 text-xs" onClick={() => transition(order, action)}>{action.replaceAll('_', ' ')}</Button>}
                  {order.orderStatus === 'DISTRIBUTOR_RECEIVED' && <Button disabled={busyId === order.id} className="!border-red-200 !bg-white !text-red-600 !px-3 !py-1.5 text-xs" onClick={() => reject(order)}>Reject</Button>}
                  {order.orderStatus === 'READY_FOR_DELIVERY' && <><select className="field max-w-xs py-1.5 text-xs" value={staff} onChange={event => setStaff(event.target.value)}>{staffOptions.map(person => <option key={person.uid || person.id} value={person.uid || person.id}>{person.displayName || person.email}</option>)}</select><Button disabled={busyId === order.id} className="!px-3 !py-1.5 text-xs" onClick={() => prepareShipment(order)}>Prepare shipment</Button></>}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
