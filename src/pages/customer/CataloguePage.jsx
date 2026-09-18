import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { useAuth } from '../../context/AuthContext'
import { addToCart } from '../../services/cartService'
import { subscribeCatalogue } from '../../services/catalogueService'
import { PublicLayout } from '../public/PublicPages'

const anyCategory = 'ALL'

export default function CataloguePage() {
  const { currentUser } = useAuth()
  const [items, setItems] = useState(null)
  const [filters, setFilters] = useState({
    term: '',
    categoryId: anyCategory,
    availability: 'ALL',
    prescription: 'ALL',
    sort: 'newest',
  })

  useEffect(() => subscribeCatalogue(setItems, 72), [])

  const categories = useMemo(() => {
    const map = new Map()
    ;(items || []).forEach(item => {
      if (item.categoryId) map.set(item.categoryId, item.categoryName || item.categoryId)
    })
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [items])

  const rows = useMemo(() => {
    if (!items) return []
    const term = filters.term.toLowerCase()
    return items
      .filter(item => {
        const searchable = `${item.name || ''} ${item.genericName || ''} ${item.brandName || ''} ${item.categoryName || ''}`.toLowerCase()
        const inStock = Number(item.availableQuantity || 0) > 0
        return (
          searchable.includes(term) &&
          (filters.categoryId === anyCategory || item.categoryId === filters.categoryId) &&
          (filters.availability === 'ALL' || (filters.availability === 'IN_STOCK' ? inStock : !inStock)) &&
          (filters.prescription === 'ALL' ||
            (filters.prescription === 'REQUIRED' ? item.prescriptionRequired : !item.prescriptionRequired))
        )
      })
      .sort((a, b) => {
        if (filters.sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0)
        if (filters.sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0)
        if (filters.sort === 'availability') return Number(b.availableQuantity || 0) - Number(a.availableQuantity || 0)
        return 0
      })
  }, [items, filters])

  const update = event => setFilters({ ...filters, [event.target.name]: event.target.value })

  if (!items) return <LoadingSpinner />

  const content = (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <section className="rounded-[2rem] border border-teal-100 bg-white p-6 shadow-sm md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-700">
              <ShieldCheck size={17} />
              Firestore-backed public catalogue
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-5xl">Find verified medicines</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Browse controlled catalogue listings generated from approved inventory. Private stock and organization data stay protected.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <p className="text-sm text-slate-300">Visible listings</p>
            <p className="mt-1 text-3xl font-bold">{items.length}</p>
            <p className="mt-3 text-sm text-slate-300">No sample products are shown when Firestore has no catalogue records.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="panel h-fit p-5">
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <SlidersHorizontal size={18} />
            Filters
          </p>
          <div className="mt-4 space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={18} />
              <input className="field pl-10" name="term" placeholder="Medicine, brand, generic" value={filters.term} onChange={update} />
            </label>
            <select className="field bg-white" name="categoryId" value={filters.categoryId} onChange={update}>
              <option value={anyCategory}>All categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select className="field bg-white" name="availability" value={filters.availability} onChange={update}>
              <option value="ALL">All availability</option>
              <option value="IN_STOCK">In stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>
            <select className="field bg-white" name="prescription" value={filters.prescription} onChange={update}>
              <option value="ALL">Prescription: all</option>
              <option value="REQUIRED">Prescription required</option>
              <option value="NOT_REQUIRED">No prescription flag</option>
            </select>
            <select className="field bg-white" name="sort" value={filters.sort} onChange={update}>
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="availability">Availability</option>
            </select>
          </div>
        </aside>

        <div>
          {!rows.length ? (
            <div className="panel p-10 text-center">
              <h2 className="text-xl font-bold text-slate-950">No medicines found</h2>
              <p className="mt-2 text-sm text-slate-500">Try changing filters, or add approved inventory to publish catalogue listings.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map(item => {
                const inStock = Number(item.availableQuantity || 0) > 0
                return (
                  <article className="panel overflow-hidden" key={item.id}>
                    <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
                      {item.imageUrl ? (
                        <img className="h-full w-full object-cover" src={item.imageUrl} alt={item.name} />
                      ) : (
                        <PackagePlus className="text-brand-600" size={44} />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-brand-700">{item.genericName || 'Generic name unavailable'}</p>
                          <h2 className="mt-1 text-xl font-bold text-slate-950">{item.name}</h2>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {item.prescriptionRequired ? 'Rx' : 'OTC'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {[item.strength, item.dosageForm].filter(Boolean).join(' | ') || 'Dose details unavailable'}
                      </p>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-500">Selling price</p>
                          <p className="text-2xl font-bold text-slate-950">Rs. {Number(item.price || 0).toFixed(2)}</p>
                        </div>
                        <p className={`text-sm font-semibold ${inStock ? 'text-teal-700' : 'text-red-600'}`}>
                          {inStock ? `${item.availableQuantity} available` : 'Out of stock'}
                        </p>
                      </div>
                      <div className="mt-5 flex gap-2">
                        <Link className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" to={`/medicines/${item.id}`}>
                          Details
                        </Link>
                        {currentUser ? (
                          <button
                            disabled={!inStock}
                            onClick={() =>
                              addToCart(currentUser.uid, {
                                inventoryId: item.inventoryId,
                                drugId: item.drugId,
                                batchId: item.batchId,
                                quantity: 1,
                                unitPrice: Number(item.price || 0),
                                availableQuantity: Number(item.availableQuantity || 0),
                                drugName: item.name,
                                imageUrl: item.imageUrl || '',
                              })
                                .then(() => toast.success('Added to cart'))
                                .catch(error => toast.error(error.message))
                            }
                            className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            Add to cart
                          </button>
                        ) : (
                          <Link className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white" to="/login">
                            Sign in to order
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )

  return currentUser ? content : <PublicLayout>{content}</PublicLayout>
}
