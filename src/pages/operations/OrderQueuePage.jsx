import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { createTrustedShipment, updateTrustedOrderStatus } from '../../services/functionsService'
import { subscribeAllOrders, subscribeOrders } from '../../services/orderService'

const nextAction = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'PACKED',
  PACKED: 'SHIPMENT',
  SHIPPED: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
  DELIVERED: 'COMPLETED',
}

const terminal = new Set(['COMPLETED', 'CANCELLED', 'RETURNED'])

function currency(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

function label(status) {
  return status === 'SHIPMENT' ? 'Create shipment' : `Move to ${status.replaceAll('_', ' ')}`
}

export default function OrderQueuePage({ admin = false }) {
  const { currentUser, role } = useAuth()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('ACTIVE')
  const [busyId, setBusyId] = useState('')

  useEffect(() => {
    if (admin || role === ROLES.ADMIN) return subscribeAllOrders(setOrders)
    return subscribeOrders(currentUser.uid, setOrders, true)
  }, [admin, currentUser, role])

  const visible = useMemo(() => {
    if (!orders) return []
    if (filter === 'ALL') return orders
    if (filter === 'ACTIVE') return orders.filter(order => !terminal.has(order.orderStatus))
    return orders.filter(order => order.orderStatus === filter)
  }, [orders, filter])

  if (!orders) return <LoadingSpinner />

  const advance = async order => {
    const action = nextAction[order.orderStatus]
    if (!action) return

    setBusyId(order.id)
    try {
      if (action === 'SHIPMENT') {
        await createTrustedShipment({
          orderId: order.id,
          carrierName: 'DrugTrack Logistics',
          trackingNumber: `DT-TRK-${String(Date.now()).slice(-6)}`,
        })
        toast.success('Shipment created.')
      } else {
        await updateTrustedOrderStatus({ orderId: order.id, status: action })
        toast.success('Order updated.')
      }
    } catch (error) {
      toast.error(error.message || 'Unable to update order.')
    } finally {
      setBusyId('')
    }
  }

  const cancel = async order => {
    if (!confirm(`Cancel ${order.orderNumber}? Reserved stock will be released by the Function.`)) return
    setBusyId(order.id)
    try {
      await updateTrustedOrderStatus({ orderId: order.id, status: 'CANCELLED' })
      toast.success('Order cancelled.')
    } catch (error) {
      toast.error(error.message || 'Unable to cancel order.')
    } finally {
      setBusyId('')
    }
  }

  return (
    <>
      <PageHeader
        title={admin ? 'All orders' : `${role.replaceAll('_', ' ')} orders`}
        description="Trusted operational order queue. Status updates call Cloud Functions instead of editing Firestore directly."
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select className="field max-w-xs bg-white" value={filter} onChange={event => setFilter(event.target.value)}>
          {['ACTIVE', 'ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'].map(
            item => (
              <option key={item} value={item}>
                {item.replaceAll('_', ' ')}
              </option>
            ),
          )}
        </select>
      </div>

      {!visible.length ? (
        <EmptyState title="No orders found" description="Orders matching this filter will appear here in real time." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['Order', 'Customer', 'Items', 'Amount', 'Status', 'Actions'].map(item => (
                  <th className="p-3 font-semibold" key={item}>
                    {item}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(order => {
                const action = nextAction[order.orderStatus]
                const cancellable = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.orderStatus)
                return (
                  <tr className="border-t border-slate-100" key={order.id}>
                    <td className="p-3">
                      <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.id}</p>
                    </td>
                    <td className="p-3 text-slate-600">{order.customerId}</td>
                    <td className="p-3 text-slate-600">{order.items?.length || 0}</td>
                    <td className="p-3 font-semibold">{currency(order.totalAmount)}</td>
                    <td className="p-3">
                      <StatusBadge status={order.orderStatus} />
                    </td>
                    <td className="flex flex-wrap gap-2 p-3">
                      {action && (
                        <Button disabled={busyId === order.id} className="!px-3 !py-1.5 text-xs" onClick={() => advance(order)}>
                          {busyId === order.id ? 'Working...' : label(action)}
                        </Button>
                      )}
                      {cancellable && (
                        <button className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600" onClick={() => cancel(order)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
