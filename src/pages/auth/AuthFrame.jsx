import { Link } from 'react-router-dom'
import { ArrowRight, PackageCheck, ShieldCheck } from 'lucide-react'

export default function AuthFrame({ title, subtitle, children }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.10),_transparent_18%),linear-gradient(135deg,#ecfeff_0%,#f8fafc_46%,#f1f5f9_100%)] p-5">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <section className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 text-2xl font-black text-brand-700">
            <span className="rounded-xl bg-gradient-to-br from-teal-600 to-cyan-600 p-2 text-white shadow-lg shadow-teal-200">
              <PackageCheck size={18} />
            </span>
            DrugTrack
          </Link>

          <div className="panel overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-gradient-to-r from-teal-50 via-white to-cyan-50 p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                <ShieldCheck size={14} /> Trusted healthcare commerce
              </div>
              <h1 className="mt-4 text-2xl font-black text-slate-950">{title}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            <div className="p-6 sm:p-8">{children}</div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-sm text-slate-500">
            <Link className="inline-flex items-center gap-1 hover:text-brand-700" to="/">
              Home <ArrowRight size={14} />
            </Link>
            <Link className="hover:text-brand-700" to="/about">
              About
            </Link>
            <Link className="hover:text-brand-700" to="/medicines">
              Medicines
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
