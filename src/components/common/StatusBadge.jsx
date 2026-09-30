const palette = {
  PENDING: 'bg-slate-100 text-slate-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-700',
  PROCESSING: 'bg-cyan-100 text-cyan-800',
  CANCELLED: 'bg-slate-200 text-slate-700',
  COMPLETED: 'bg-teal-100 text-teal-800',
}

export default function StatusBadge({ status }) {
  const value = String(status || 'PENDING').replaceAll('_', ' ')
  const tone = palette[String(status || 'PENDING')] || 'bg-teal-50 text-teal-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>
}
