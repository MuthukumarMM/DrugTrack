import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/feedback/EmptyState'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { ROLES } from '../../constants/roles'
import { useAuth } from '../../context/AuthContext'
import { updateTrustedOrderStatus } from '../../services/functionsService'
import { subscribeAllOrders, subscribeOrders } from '../../services/orderService'

const nextAction = {
  PENDING: 'UNDER_REVIEW',
  UNDER_REVIEW: 'APPROVED',
  APPROVED: 'PROCESSING',
  PROCESSING: 'PACKED',
  PACKED: 'READY_FOR_DISTRIBUTOR',
}

const terminal = new Set(['REJECTED', 'CANCELLED', 'COMPLETED', 'READY_FOR_DISTRIBUTOR', 'READY_FOR_DELIVERY', 'DELIVERED', 'RECIPIENT_CONFIRMED'])

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
    if (role === ROLES.MANUFACTURER) return subscribeOrders(currentUser.uid, setOrders, true, 'manufacturerId')
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
      await updateTrustedOrderStatus({ orderId: order.id, status: action })
      toast.success('Order updated.')
    } catch (error) {
      const failures = error.details?.failures || error.customData?.failures || []
      if (action === 'APPROVED' && failures.length) {
        const rejectionReason = window.prompt(`Validation failed (${failures.map(item => item.code).join(', ')}). Enter a rejection reason.`)?.trim()
        if (rejectionReason) {
          await updateTrustedOrderStatus({ orderId: order.id, status: 'REJECTED', rejectionReason, validationReason: failures.map(item => item.code).join(', ') })
          toast.success('Order rejected and buyer notified.')
          return
        }
      }
      toast.error(error.message || 'Unable to update order.')
    } finally {
      setBusyId('')
    }
  }

  const reject = async order => {
    const rejectionReason = window.prompt('Reason for rejecting this order?')?.trim()
    if (!rejectionReason) return
    const validationReason = window.prompt('Validation code (for example OUT_OF_STOCK, BATCH_EXPIRED, or BATCH_RECALLED)?')?.trim()
    if (!validationReason) return
    setBusyId(order.id)
    try {
      await updateTrustedOrderStatus({ orderId: order.id, status: 'REJECTED', rejectionReason, validationReason })
      toast.success('Order rejected.')
    } catch (error) {
      toast.error(error.message || 'Unable to reject order.')
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
          {['ACTIVE', 'ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'PACKED', 'READY_FOR_DISTRIBUTOR', 'COMPLETED', 'CANCELLED'].map(
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
                const cancellable = ['PENDING', 'UNDER_REVIEW', 'PROCESSING', 'PACKED'].includes(order.orderStatus)
                return (
                  <tr className="border-t border-slate-100" key={order.id}>
                    <td className="p-3">
                      <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">{order.id}</p>
                    </td>
                    <td className="p-3 text-slate-600">{order.buyerName || order.customerName || order.customerId}</td>
                    <td className="p-3 text-slate-600">
                      {(order.items || []).map(item => `${item.drugName} x${item.quantity}`).join(', ')}
                      <p className="mt-1 text-xs text-slate-400">{(order.items || []).map(item => `Batch ${item.batchId || 'n/a'} | Avail ${item.availableQuantity ?? 'n/a'} | Reserved ${item.reservedQuantity ?? 'n/a'} | Expiry ${item.expiryDate || 'n/a'} | Recall ${item.recallStatus || 'n/a'}`).join(' | ')}</p>
                    </td>
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
                      {order.orderStatus === 'UNDER_REVIEW' && (
                        <Button disabled={busyId === order.id} className="!border-red-200 !bg-white !text-red-600 !px-3 !py-1.5 text-xs" onClick={() => reject(order)}>
                          Reject
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
