function money(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`
}

export default function HistoryStats({ orders = [], deliveries = [], title = 'History summary' }) {
  const rows = orders.length ? orders : deliveries
  const delivered = orders.length
    ? orders.filter(order => ['DELIVERED', 'RECIPIENT_CONFIRMED', 'COMPLETED'].includes(order.orderStatus || order.status)).length
    : deliveries.filter(shipment => shipment.status === 'DELIVERED').length
  const completed = orders.length
    ? orders.filter(order => order.orderStatus === 'COMPLETED').length
    : deliveries.filter(shipment => shipment.status === 'DELIVERED').length
  const value = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)

  return (
    <section className="mb-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="panel p-4"><p className="text-xs text-slate-500">Total records</p><p className="mt-1 text-2xl font-black text-slate-950">{rows.length}</p></article>
        <article className="panel p-4"><p className="text-xs text-slate-500">Delivered</p><p className="mt-1 text-2xl font-black text-teal-700">{delivered}</p></article>
        <article className="panel p-4"><p className="text-xs text-slate-500">Completed</p><p className="mt-1 text-2xl font-black text-slate-950">{completed}</p></article>
        <article className="panel p-4"><p className="text-xs text-slate-500">Order value</p><p className="mt-1 text-2xl font-black text-slate-950">{money(value)}</p></article>
      </div>
    </section>
  )
}
