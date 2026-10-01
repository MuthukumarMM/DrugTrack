export default function DashboardCard({ title, description, icon: Icon }) {
	return (
		<article className="panel group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_45px_rgba(15,57,63,0.12)]">
			<div className="absolute -right-7 -top-7 h-20 w-20 rounded-full bg-teal-50 transition group-hover:scale-125" />
			{Icon && <Icon className="relative mb-5 text-brand-600" size={22} />}
			<h3 className="relative text-2xl font-black tracking-tight text-slate-950">{title}</h3>
			<p className="relative mt-1 text-sm text-slate-500">{description}</p>
		</article>
	)
}
