import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Boxes, Building2, HeartPulse, MapPinned, Menu, PackageCheck, ShieldCheck, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { submitContactMessage } from '../../services/contactService'
import { subscribeCatalogue } from '../../services/catalogueService'
import { getMedicineImage } from '../../constants/medicineImages'
import heroImage from '../../assets/hero.png'

const publicLinks = [
  ['Home', '/'],
  ['About', '/about'],
  ['Medicines', '/medicines'],
  ['Categories', '/categories'],
  ['Supply chain', '/supply-chain'],
  ['Contact', '/contact'],
]

const featureCards = [
  ['Verified network', 'Organization approval gates operational tools before medicines enter the platform.', ShieldCheck],
  ['Batch traceability', 'Drugs, batches, inventory, orders, shipments, and verification records stay connected.', Boxes],
  ['Realtime readiness', 'Firestore listeners power live stock, notifications, order status, and delivery tracking.', Activity],
  ['Customer ordering', 'Catalogue, cart, checkout, orders, history, and tracking are designed as one flow.', HeartPulse],
]

export function PublicLayout({ children }) {
  const [open, setOpen] = useState(false)
  const links = (
    <>
      {publicLinks.map(([label, to]) => (
        <Link key={to} className="text-sm font-medium text-slate-600 transition hover:text-brand-700" to={to} onClick={() => setOpen(false)}>
          {label}
        </Link>
      ))}
    </>
  )

  return (
    <div className="min-h-screen bg-transparent">
      <header className="app-topbar sticky top-0 z-30 border-b px-5 py-4">
        <nav className="mx-auto flex max-w-7xl items-center gap-4">
          <Link className="flex items-center gap-2 text-xl font-black text-brand-700" to="/">
            <span className="brand-lockup rounded-xl p-2 text-white">
              <PackageCheck size={18} />
            </span>
            DrugTrack
          </Link>
          <div className="public-nav-links ml-auto hidden items-center gap-2 md:flex">
            {links}
            <Link className="font-semibold text-slate-700 transition hover:text-brand-700" to="/login">
              Login
            </Link>
            <Link className="brand-button" to="/get-started">
              Get started
            </Link>
          </div>
          <button className="ml-auto md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu />
          </button>
        </nav>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 md:hidden" onClick={() => setOpen(false)}>
          <aside className="ml-auto h-full w-80 bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <button className="ml-auto block" onClick={() => setOpen(false)} aria-label="Close menu">
              <X />
            </button>
            <div className="mt-6 grid gap-4">
              {links}
              <Link className="font-semibold text-brand-700" to="/login">
                Login
              </Link>
              <Link className="brand-button justify-center" to="/get-started">
                Get started
              </Link>
            </div>
          </aside>
        </div>
      )}

      {children}

      <footer className="mt-16 bg-slate-950 px-5 py-10 text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-black text-white">DrugTrack</p>
            <p className="mt-1 text-sm text-slate-400">Track Every Dose. Trace Every Journey.</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-300">
            <Link to="/about">About</Link>
            <Link to="/medicines">Medicines</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const Feature = ({ icon: Icon, title, copy }) => (
  <article className="panel p-5">
    <Icon className="mb-4 text-brand-600" />
    <h3 className="font-bold text-slate-950">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
  </article>
)

function useCatalogueSummary() {
  const [items, setItems] = useState(null)
  useEffect(() => subscribeCatalogue(setItems, 24), [])
  return useMemo(() => {
    const rows = items || []
    return {
      ready: items !== null,
      listings: rows.length,
      available: rows.filter(item => Number(item.availableQuantity || 0) > 0).length,
      categories: new Set(rows.map(item => item.categoryId).filter(Boolean)).size,
      sample: rows.slice(0, 3),
    }
  }, [items])
}

export function HomePage() {
  const summary = useCatalogueSummary()

  return (
    <PublicLayout>
      <main>
        <section className="public-hero relative overflow-hidden border-b border-teal-100 px-5" style={{ backgroundImage: `linear-gradient(90deg, rgba(240,253,250,0.98) 0%, rgba(240,253,250,0.88) 47%, rgba(240,253,250,0.42) 100%), url(${heroImage})` }}>
          <div className="mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.1fr_420px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700 shadow-sm">
                <ShieldCheck size={14} />
                Real-time pharmaceutical platform
              </div>
              <h1 className="mt-6 max-w-4xl text-balance text-4xl font-black text-slate-950 md:text-6xl">
                Order medicines and manage every supply step with confidence.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                DrugTrack brings together customers, manufacturers, warehouses, distributors, pharmacies, hospitals, and delivery teams in one premium healthcare marketplace built for trust, speed, and traceability.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link className="brand-button" to="/get-started">
                  Get started
                </Link>
                <Link className="soft-button" to="/medicines">
                  Browse medicines
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" /> Verified network</div>
                <div className="flex items-center gap-2"><Activity size={16} className="text-brand-600" /> Live tracking</div>
                <div className="flex items-center gap-2"><Boxes size={16} className="text-brand-600" /> Batch traceability</div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-6 h-32 w-32 rounded-full bg-teal-200/60 blur-3xl" />
              <div className="absolute -right-10 bottom-4 h-32 w-32 rounded-full bg-cyan-200/70 blur-3xl" />
              <div className="relative rounded-[2rem] border border-teal-100 bg-white/85 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                <div className="grid gap-3">
                  {[
                    ['Catalogue listings', summary.ready ? summary.listings : '...'],
                    ['Available medicines', summary.ready ? summary.available : '...'],
                    ['Categories', summary.ready ? summary.categories : '...'],
                  ].map(([label, value]) => (
                    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4" key={label}>
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="text-2xl font-black text-slate-950">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-5 text-white">
                  <div className="flex items-center gap-2 text-brand-300">
                    <MapPinned size={18} />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em]">Live route status</span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold">Realtime tracking ready</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Shipment location and status updates flow through Firestore snapshots and customer-facing tracking views.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="font-semibold uppercase tracking-[0.18em] text-brand-700">Why DrugTrack</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Built for modern healthcare commerce</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map(([title, copy, Icon]) => (
              <Feature key={title} title={title} copy={copy} icon={Icon} />
            ))}
          </div>
        </section>

        <section className="section-shell pb-12">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="font-semibold uppercase tracking-[0.18em] text-brand-700">Live catalogue</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">Popular medicines right now</h2>
              </div>
              <Link className="hidden items-center gap-2 font-semibold text-brand-700 sm:flex" to="/medicines">
                View all <ArrowRight size={17} />
              </Link>
            </div>

            {!summary.sample.length ? (
              <div className="panel mt-6 p-8 text-center text-slate-500">Catalogue listings will appear here after approved inventory is published.</div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {summary.sample.map(item => (
                  <Link className="panel block overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-[0_24px_40px_rgba(15,23,42,0.09)]" to={`/medicines/${item.id}`} key={item.id}>
                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-white">
                      {getMedicineImage(item) ? (
                        <img className="h-full w-full object-cover" src={getMedicineImage(item)} alt={item.name} />
                      ) : (
                        <PackageCheck className="text-brand-600" size={44} />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-sm font-semibold text-brand-700">{item.genericName || 'Medicine'}</p>
                      <h3 className="mt-2 text-xl font-bold text-slate-950">{item.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">{[item.strength, item.dosageForm].filter(Boolean).join(' | ')}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xl font-black text-slate-950">Rs. {Number(item.price || 0).toFixed(2)}</p>
                        <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                          {Number(item.availableQuantity || 0) > 0 ? 'In stock' : 'Low stock'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}

export function AboutPage() {
  const workflow = [
    ['01', 'Choose your workspace', 'Customers, hospitals, pharmacies, manufacturers, distributors, and delivery staff each receive a focused workspace with the permissions and tools for their job.', HeartPulse],
    ['02', 'Browse and place a request', 'A customer, hospital, or pharmacy browses verified medicine listings, adds stock to the cart, confirms a Tirunelveli delivery address, and places a manufacturer-directed order.', Boxes],
    ['03', 'Manufacturer reviews the order', 'The manufacturer validates stock, batch quality, expiry, recall status, and quantities before approving the request. Every decision becomes part of the order history.', ShieldCheck],
    ['04', 'Distributor prepares the handoff', 'Approved stock moves through distributor acceptance, processing, packing coordination, and readiness for delivery while the buyer sees each status change live.', Truck],
    ['05', 'Delivery staff completes the journey', 'The rider receives the shipment at the Francis Xavier Engineering College source, follows the Tirunelveli route, updates live location, and completes the handoff.', MapPinned],
    ['06', 'Recipient confirms and reviews', 'The recipient confirms delivery, rates the service, writes a review, and keeps the complete order record in history for future reference.', Activity],
  ]

  const roles = [
    ['Buyers', 'Customers, hospitals, and pharmacies can order manufacturer stock, manage addresses, follow approvals, track shipments, and review completed deliveries.', HeartPulse],
    ['Manufacturers', 'Create medicines, manage batches and inventory, validate incoming requests, approve safe orders, and release stock into distribution.', Building2],
    ['Distributors', 'Receive approved orders, verify quantities and batches, prepare shipments, assign delivery staff, and hand off stock safely.', Truck],
    ['Administrators', 'Manage users, approvals, catalogue records, batches, inventory, orders, contact messages, and system-wide history.', ShieldCheck],
  ]

  return (
    <PublicLayout>
      <main className="public-content-shell public-about mx-auto max-w-7xl px-5 py-10 md:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <p className="page-header-kicker">About DrugTrack</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">The connected operating system for trusted medicine movement.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              DrugTrack connects the people and organizations that make a medicine journey safe: the buyer who needs stock, the manufacturer who approves it, the distributor who prepares it, and the delivery team that completes the final handoff.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-[0_24px_55px_rgba(15,23,42,0.18)]">
            <div className="flex items-center gap-2 text-teal-300"><ShieldCheck size={19} /><span className="text-xs font-bold uppercase tracking-[0.18em]">Built for traceability</span></div>
            <p className="mt-5 text-2xl font-black leading-tight">Every order has an owner, every batch has a story, and every handoff leaves a record.</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">From first browse to final review, DrugTrack keeps the full supply journey visible in one place.</p>
          </div>
        </section>

        <section className="mt-16">
          <div className="max-w-2xl">
            <p className="page-header-kicker">How the platform works</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">One medicine journey, six connected moments</h2>
            <p className="mt-3 leading-7 text-slate-600">The interface changes with the user, but the underlying process remains connected from order request to completed delivery.</p>
          </div>
          <div className="relative mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflow.map(([number, title, copy, Icon]) => (
              <article className="public-feature-card panel group relative p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,57,63,0.12)]" key={number}>
                <div className="flex items-center justify-between"><span className="text-4xl font-black text-teal-100">{number}</span><span className="rounded-2xl bg-teal-50 p-3 text-teal-700"><Icon size={22} /></span></div>
                <h3 className="mt-6 text-lg font-black text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-gradient-to-br from-teal-700 via-cyan-700 to-slate-900 p-6 text-white shadow-[0_25px_60px_rgba(15,118,110,0.2)] md:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-200">The buyer-to-delivery flow</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">Browse. Approve. Move. Deliver. Learn.</h2>
            <p className="mt-4 text-sm leading-7 text-teal-50 md:text-base">A buyer starts with a medicine requirement. DrugTrack turns it into a structured request that can be validated, packed, routed, tracked, confirmed, rated, and revisited later.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-2 text-sm font-bold">
            {['Buyer request', 'Manufacturer approval', 'Distributor handoff', 'Rider route', 'Recipient review'].map((step, index) => <span key={step} className="inline-flex items-center gap-2"><span className="rounded-full border border-white/25 bg-white/10 px-3 py-2 backdrop-blur">{step}</span>{index < 4 && <ArrowRight size={16} className="text-teal-200" />}</span>)}
          </div>
        </section>

        <section className="mt-16">
          <p className="page-header-kicker">Made for every role</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">A dedicated view for every responsibility</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {roles.map(([title, copy, Icon]) => <article className="public-feature-card panel p-6" key={title}><span className="inline-flex rounded-2xl bg-slate-950 p-3 text-teal-300"><Icon size={21} /></span><h3 className="mt-5 text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}
          </div>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            ['Verified by design', 'Role-based access, organization approval, batch validation, and server-authoritative checkout keep the workflow accountable.'],
            ['Live by default', 'Firestore listeners connect stock, order status, shipment telemetry, notifications, reviews, and history as events happen.'],
            ['Ready for real operations', 'Dashboards, search, filters, saved addresses, delivery history, ratings, and admin oversight support repeated daily work.'],
          ].map(([title, copy]) => <article className="rounded-[1.5rem] border border-slate-200 bg-white/75 p-6 shadow-sm" key={title}><h3 className="text-lg font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}
        </section>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-teal-100 bg-white/80 p-6 shadow-sm">
          <div><p className="text-lg font-black text-slate-950">Ready to explore the live catalogue?</p><p className="mt-1 text-sm text-slate-500">Start with verified medicines or choose the workspace built for your role.</p></div>
          <div className="flex flex-wrap gap-3"><Link className="brand-button" to="/medicines">Browse medicines</Link><Link className="soft-button" to="/get-started">Choose workspace</Link></div>
        </div>
      </main>
    </PublicLayout>
  )
}

export function CategoriesPage() {
  const [items, setItems] = useState(null)
  useEffect(() => subscribeCatalogue(setItems, 72), [])
  const grouped = useMemo(() => {
    const map = new Map()
    ;(items || []).forEach(item => {
      const id = item.categoryId || 'uncategorized'
      const current = map.get(id) || { id, name: item.categoryName || 'Uncategorized', count: 0, available: 0 }
      current.count += 1
      current.available += Number(item.availableQuantity || 0) > 0 ? 1 : 0
      map.set(id, current)
    })
    return [...map.values()]
  }, [items])

  return (
    <PublicLayout>
      <main className="public-content-shell public-categories mx-auto max-w-7xl px-5 py-16">
        <p className="font-semibold text-brand-700">CATEGORIES</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Medicine categories from the live catalogue</h1>
        {!items ? (
          <div className="panel mt-6 p-8 text-center text-slate-500">Loading categories...</div>
        ) : !grouped.length ? (
          <div className="panel mt-6 p-8 text-center text-slate-500">No catalogue categories are available yet.</div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.map(category => (
              <Link className="public-feature-card panel block p-5 transition hover:-translate-y-1 hover:shadow-md" to="/medicines" key={category.id}>
                <Boxes className="text-brand-600" />
                <h2 className="mt-4 text-xl font-bold text-slate-950">{category.name}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {category.count} listing{category.count === 1 ? '' : 's'} | {category.available} in stock
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </PublicLayout>
  )
}

export function SupplyChainPage() {
  const steps = [
    ['Manufacturer', 'Creates drugs, batches, quality records, and approved stock.', Building2],
    ['Warehouse', 'Receives, stores, verifies, and dispatches batch inventory.', Boxes],
    ['Distributor', 'Coordinates regional movement, seller orders, and shipment assignment.', Truck],
    ['Pharmacy / Hospital', 'Manages patient-facing inventory, expiry risk, and fulfillment.', HeartPulse],
    ['Customer', 'Orders medicine, tracks delivery, and reviews completed orders.', MapPinned],
  ]

  return (
    <PublicLayout>
      <main className="public-content-shell public-supply mx-auto max-w-7xl px-5 py-16">
        <p className="font-semibold text-brand-700">SUPPLY CHAIN</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Trace every medicine journey</h1>
        <div className="mt-10 grid gap-4 lg:grid-cols-5">
          {steps.map(([title, copy, Icon], index) => (
            <article className="public-feature-card panel p-5" key={title}>
              <p className="text-sm font-semibold text-brand-700">STEP {index + 1}</p>
              <Icon className="mt-5 text-brand-600" />
              <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
            </article>
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [busy, setBusy] = useState(false)
  const update = event => setForm({ ...form, [event.target.name]: event.target.value })
  const send = async event => {
    event.preventDefault()
    setBusy(true)
    try {
      await submitContactMessage(form)
      toast.success('Message sent successfully.')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (error) {
      toast.error(error.message || 'Unable to send message.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PublicLayout>
      <main className="public-content-shell public-contact mx-auto max-w-3xl px-5 py-16">
        <p className="font-semibold text-brand-700">CONTACT</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Talk to DrugTrack</h1>
        <p className="mt-3 text-slate-600">Messages are stored in Firestore `contactMessages` for administrator review.</p>
        <form onSubmit={send} className="panel mt-7 grid gap-4 p-6">
          {[
            ['name', 'Full name'],
            ['email', 'Email'],
            ['phone', 'Phone'],
            ['subject', 'Subject'],
          ].map(([name, label]) => (
            <input
              key={name}
              aria-label={label}
              className="field"
              name={name}
              required={name !== 'phone'}
              placeholder={label}
              value={form[name]}
              onChange={update}
            />
          ))}
          <textarea
            className="field min-h-36"
            name="message"
            required
            placeholder="Message"
            value={form.message}
            onChange={update}
          />
          <button disabled={busy} className="rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {busy ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </main>
    </PublicLayout>
  )
}
