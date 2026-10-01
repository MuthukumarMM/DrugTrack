import { Inbox } from 'lucide-react'

export default function EmptyState({ title = 'Nothing here yet', description }) {
	return <div className="panel p-12 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Inbox size={26} /></div><h3 className="mt-4 text-lg font-bold text-slate-950">{title}</h3>{description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}</div>
}
