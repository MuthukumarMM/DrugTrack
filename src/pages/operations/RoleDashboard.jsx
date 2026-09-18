import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Clock,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { expiryState, subscribeInventory } from '../../services/inventoryService'
import { subscribeOrders } from '../../services/orderService'
import { subscribeBatches } from '../../services/batchService'
import DashboardCard from '../../components/common/DashboardCard'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'

const ROLE_METADATA = {
  MANUFACTURER: {
    title: 'Manufacturing Command Centre',
    description: 'Monitor factory batch production, quality approval compliance, and wholesale order dispatches.',
    quickActions: [
      { label: 'Register New Batch', to: '/manufacturer/batches' },
      { label: 'Formulary Drugs', to: '/manufacturer/my-drugs' },
      { label: 'Factory Inventory', to: '/manufacturer/inventory' },
      { label: 'Incoming Orders', to: '/manufacturer/orders' },
    ],
  },
  WAREHOUSE_MANAGER: {
    title: 'Warehouse Logistics & Storage',
    description: 'Track cold-chain storage bins, batch allocation, picking workflows, and restocking thresholds.',
    quickActions: [
      { label: 'Warehouse Stock', to: '/warehouse/inventory' },
      { label: 'Storage Allocations', to: '/warehouse/inventory' },
    ],
  },
  DISTRIBUTOR: {
    title: 'Distribution Network Hub',
    description: 'Coordinate wholesale medicine movement, cross-dock shipments, and pharmacy fulfillment.',
    quickActions: [
      { label: 'Distribution Stock', to: '/distributor/inventory' },
      { label: 'Dispatches & Orders', to: '/distributor/orders' },
    ],
  },
  PHARMACY: {
    title: 'Pharmacy Operations Dashboard',
    description: 'Manage counter inventory, low-stock reorders, batch expiry, and patient prescription orders.',
    quickActions: [
      { label: 'Stock & Batches', to: '/pharmacy/my-inventory' },
      { label: 'Customer Orders', to: '/pharmacy/orders' },
    ],
  },
  HOSPITAL: {
    title: 'Hospital Pharmacy Command Centre',
    description: 'Oversee department inventory, critical emergency drug reserves, and ward dispensing safety.',
    quickActions: [
      { label: 'Hospital Inventory', to: '/hospital/inventory' },
      { label: 'Emergency Supplies', to: '/hospital/orders' },
    ],
  },
}

export default function RoleDashboard({ role }) {
  const { currentUser } = useAuth()
  const [inventory, setInventory] = useState(null)
  const [orders, setOrders] = useState([])
  const [batches, setBatches] = useState([])

  const config = ROLE_METADATA[role] || {
    title: `${(role || '').replace(/_/g, ' ')} Workspace`,
    description: 'Manage authorized pharmaceutical records and operations.',
    quickActions: [],
  }

  // Subscribe to real role-targeted inventory
  useEffect(() => {
    if (!currentUser) return undefined
    return subscribeInventory(setInventory, currentUser.uid)
  }, [currentUser])

  // Subscribe to incoming orders where this facility is the seller/fulfiller
  useEffect(() => {
    if (!currentUser) return undefined
    return subscribeOrders(currentUser.uid, setOrders, true)
  }, [currentUser])

  // Subscribe to batches if manufacturer
  useEffect(() => {
    if (!currentUser || role !== 'MANUFACTURER') return undefined
    return subscribeBatches(setBatches, currentUser.uid)
  }, [currentUser, role])

  // Computed metrics
  const stats = useMemo(() => {
    const inv = inventory || []
    const totalUnits = inv.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
    const reservedUnits = inv.reduce((sum, item) => sum + Number(item.reservedQuantity || 0), 0)
    const availableUnits = Math.max(0, totalUnits - reservedUnits)

    const lowStockItems = inv.filter(
      item => Number(item.quantity || 0) <= Number(item.reorderLevel || 0)
    )

    const expiringItems = inv.filter(
      item => expiryState(item.expiryDate) !== 'VALID'
    )

    const emergencyStockUnits = inv.reduce(
      (sum, item) => sum + Number(item.emergencyStock || 0),
      0
    )

    const pendingOrdersCount = orders.filter(o =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status)
    ).length

    const completedOrdersCount = orders.filter(o =>
      ['DELIVERED', 'COMPLETED'].includes(o.status)
    ).length

    return {
      recordCount: inv.length,
      totalUnits,
      reservedUnits,
      availableUnits,
      lowStockCount: lowStockItems.length,
      expiringCount: expiringItems.length,
      emergencyStockUnits,
      pendingOrdersCount,
      completedOrdersCount,
      batchCount: batches.length,
      lowStockItems,
      expiringItems,
    }
  }, [inventory, orders, batches])

  // Inventory distribution chart
  const chartData = useMemo(() => {
    const healthy = Math.max(0, stats.recordCount - stats.lowStockCount - stats.expiringCount)
    return [
      { name: 'Optimal Stock', value: healthy, color: '#0d9488' },
      { name: 'Low Stock Alert', value: stats.lowStockCount, color: '#f59e0b' },
      { name: 'Near/Past Expiry', value: stats.expiringCount, color: '#ef4444' },
    ].filter(item => item.value > 0)
  }, [stats])

  if (inventory === null) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
      />

      {/* Role-specific Quick Links */}
      {config.quickActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
            Quick Actions:
          </span>
          {config.quickActions.map(action => (
            <Link
              key={action.label}
              to={action.to}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:border-teal-300 hover:text-teal-700 transition"
            >
              {action.label}
              <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard
          title={String(stats.availableUnits)}
          description="Available Units for Sale"
          icon={PackageCheck}
        />
        <DashboardCard
          title={String(stats.recordCount)}
          description={role === 'MANUFACTURER' ? 'Active Drug SKUs' : 'Tracked Inventory SKUs'}
          icon={Boxes}
        />
        <DashboardCard
          title={String(stats.pendingOrdersCount)}
          description="Pending Orders in Queue"
          icon={Clock}
        />
        <DashboardCard
          title={String(stats.lowStockCount)}
          description="Low Stock Warnings"
          icon={AlertTriangle}
        />
      </div>

      {/* Role-specific secondary metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness and chart breakdown */}
        <section className="panel p-6 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Health & Compliance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time stock evaluation from verified Firestore inventory.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              <ShieldCheck size={14} />
              Verified Facility
            </span>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 items-center">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs font-medium text-slate-600">Total Physical Units</span>
                <span className="text-sm font-bold text-slate-900">{stats.totalUnits}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs font-medium text-slate-600">Reserved for Packing</span>
                <span className="text-sm font-bold text-slate-900">{stats.reservedUnits}</span>
              </div>
              {role === 'HOSPITAL' && (
                <div className="flex items-center justify-between rounded-xl bg-red-50 p-3.5 text-red-900">
                  <span className="text-xs font-medium">Emergency Reserve Stock</span>
                  <span className="text-sm font-bold">{stats.emergencyStockUnits}</span>
                </div>
              )}
              {role === 'MANUFACTURER' && (
                <div className="flex items-center justify-between rounded-xl bg-teal-50 p-3.5 text-teal-900">
                  <span className="text-xs font-medium">Certified Production Batches</span>
                  <span className="text-sm font-bold">{stats.batchCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5">
                <span className="text-xs font-medium text-slate-600">Dispatched / Completed Orders</span>
                <span className="text-sm font-bold text-slate-900">{stats.completedOrdersCount}</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="h-44 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {chartData.map(entry => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '0.75rem',
                          border: 'none',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No active stock data to display.
                  </div>
                )}
              </div>
              {chartData.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                  {chartData.map(item => (
                    <span key={item.name} className="flex items-center gap-1.5 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name} ({item.value})
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Expiry & Quality Alert Panel */}
        <section className="panel p-6">
          <h2 className="text-base font-bold text-slate-900">Safety & Expiry Alerts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Batches flagged for review or reordering.
          </p>

          <div className="mt-4 space-y-3">
            {stats.expiringCount > 0 ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold">{stats.expiringCount} batch(es) near or past expiration</p>
                  <p className="mt-0.5 text-red-700">Immediate quarantine or return advised.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>All active batch records are within safe expiration limits.</span>
              </div>
            )}

            {stats.lowStockCount > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">{stats.lowStockCount} SKU(s) below reorder threshold</p>
                  <p className="mt-0.5 text-amber-700">Initiate supply chain purchase orders.</p>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
              <p className="font-semibold text-slate-700">Supply Chain Standard Compliance</p>
              <p className="text-slate-500 leading-relaxed">
                All medicines are tracked with immutable batch numbers and verifiable QR certificates under DrugTrack standards.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Orders in Facility Queue */}
      <section className="panel p-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Order Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest incoming supply chain requests for this facility.
            </p>
          </div>
          <Link
            to={
              role === 'MANUFACTURER'
                ? '/manufacturer/orders'
                : role === 'DISTRIBUTOR'
                ? '/distributor/orders'
                : role === 'PHARMACY'
                ? '/pharmacy/orders'
                : role === 'HOSPITAL'
                ? '/hospital/orders'
                : '#'
            }
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1"
          >
            View All Orders
            <ArrowRight size={14} />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-slate-500">No incoming orders currently pending.</p>
            <p className="text-xs text-slate-400 mt-1">
              New orders routed to this facility will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3">Total (Rs.)</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {o.orderNumber || o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {o.items?.length || 0} product(s)
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900">
                      Rs. {Number(o.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-slate-500">
                      {o.createdAt?.toDate
                        ? o.createdAt.toDate().toLocaleDateString()
                        : new Date().toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
