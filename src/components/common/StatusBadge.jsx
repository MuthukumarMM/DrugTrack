export default function StatusBadge({status}){return <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">{String(status).replaceAll('_',' ')}</span>}
