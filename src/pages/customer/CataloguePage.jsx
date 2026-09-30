import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Minus,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from 'lucide-react'
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
  const [quantities, setQuantities] = useState({})
  const [addingId, setAddingId] = useState(null)
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
    const term = filters.term.toLowerCase().trim()
    return items
      .filter(item => {
        const searchable = `${item.name || ''} ${item.genericName || ''} ${item.brandName || ''} ${item.categoryName || ''} ${item.sellerName || ''}`.toLowerCase()
        const inStock = Number(item.availableQuantity || 0) > 0
        return (
          (!term || searchable.includes(term)) &&
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

  const changeQuantity = (itemId, delta, max) => {
    const current = quantities[itemId] || 1
    const next = Math.max(1, Math.min(max, current + delta))
    setQuantities({ ...quantities, [itemId]: next })
  }

  const handleAddToCart = async item => {
    if (!currentUser) return
    const qty = quantities[item.id] || 1
    setAddingId(item.id)
    try {
      await addToCart(currentUser.uid, {
        inventoryId: item.inventoryId,
        drugId: item.drugId,
        batchId: item.batchId,
        quantity: qty,
        unitPrice: Number(item.price || 0),
        availableQuantity: Number(item.availableQuantity || 0),
        drugName: item.name,
        imageUrl: item.imageUrl || '',
        sellerId: item.sellerId,
        sellerType: item.sellerType,
        sellerName: item.sellerName,
        manufacturerId: item.manufacturerId,
        manufacturerName: item.manufacturerName,
        distributorId: item.distributorId,
        distributorName: item.distributorName,
      })
      toast.success(`Added ${qty} × ${item.name} to cart`)
    } catch (error) {
      toast.error(error.message || 'Could not add to cart.')
    } finally {
      setAddingId(null)
    }
  }

  if (!items) return <LoadingSpinner />

  const content = (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <section className="rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-900 to-slate-900 p-6 text-white shadow-sm md:p-8">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-300">
            <ShieldCheck size={16} />
            Verified Pharmaceutical Supply Chain Marketplace
          </div>
          <h1 className="mt-2 text-2xl md:text-4xl font-extrabold tracking-tight">
            Order Certified Medicines
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Every product is batch-verified, cold-chain monitored, and supplied directly by licensed manufacturers, distributors, and pharmacies.
          </p>

          {/* Quick search input in hero */}
          <div className="mt-5 relative max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-700 bg-slate-800/90 pl-11 pr-10 py-3 text-sm text-white placeholder-slate-400 focus:border-teal-400 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              name="term"
              placeholder="Search by brand, medicine name, generic formula, or category..."
              value={filters.term}
              onChange={update}
            />
            {filters.term && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, term: '' })}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Category Pills Navigation (Amazon/Delivery App style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilters({ ...filters, categoryId: anyCategory })}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
            filters.categoryId === anyCategory
              ? 'bg-teal-700 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700'
          }`}
        >
          All Categories ({items.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilters({ ...filters, categoryId: cat.id })}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
              filters.categoryId === cat.id
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-300 hover:text-teal-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Main Filter & Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar Filters */}
        <aside className="panel h-fit p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-teal-700" />
              Refine Results
            </span>
            {(filters.categoryId !== anyCategory || filters.availability !== 'ALL' || filters.prescription !== 'ALL' || filters.term) && (
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    term: '',
                    categoryId: anyCategory,
                    availability: 'ALL',
                    prescription: 'ALL',
                    sort: 'newest',
                  })
                }
                className="text-xs text-teal-700 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Availability</label>
              <select
                className="field w-full bg-white text-xs"
                name="availability"
                value={filters.availability}
                onChange={update}
              >
                <option value="ALL">All Items</option>
                <option value="IN_STOCK">In Stock Only</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Prescription Policy</label>
              <select
                className="field w-full bg-white text-xs"
                name="prescription"
                value={filters.prescription}
                onChange={update}
              >
                <option value="ALL">All Types</option>
                <option value="NOT_REQUIRED">Over-The-Counter (OTC)</option>
                <option value="REQUIRED">Prescription Required (Rx)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Sort Order</label>
              <select
                className="field w-full bg-white text-xs"
                name="sort"
                value={filters.sort}
                onChange={update}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="availability">Stock: Highest First</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Verified Marketplace</p>
            <p className="mt-1">
              Showing {rows.length} of {items.length} verified listings.
            </p>
          </div>
        </aside>

        {/* Medicine Cards Grid */}
        <main>
          {rows.length === 0 ? (
            <div className="panel p-12 text-center">
              <PackagePlus size={44} className="mx-auto text-slate-300" />
              <h2 className="mt-3 text-lg font-bold text-slate-900">No medicines found</h2>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                No active inventory matches your criteria. Try loosening your filters or clearing search terms.
              </p>
              <button
                type="button"
                onClick={() =>
                  setFilters({
                    term: '',
                    categoryId: anyCategory,
                    availability: 'ALL',
                    prescription: 'ALL',
                    sort: 'newest',
                  })
                }
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map(item => {
                const available = Number(item.availableQuantity || 0)
                const inStock = available > 0
                const qty = quantities[item.id] || 1
                const isAdding = addingId === item.id

                return (
                  <article
                    key={item.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-200 hover:shadow-md transition"
                  >
                    <div>
                      {/* Product Image and Badges */}
                      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <PackagePlus className="text-teal-600/70" size={40} />
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              item.prescriptionRequired
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-teal-100 text-teal-900'
                            }`}
                          >
                            {item.prescriptionRequired ? 'Rx' : 'OTC'}
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              inStock
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {inStock ? `${available} In Stock` : 'Out of Stock'}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="truncate font-medium text-teal-700">
                            {item.categoryName || 'General Health'}
                          </span>
                          {item.brandName && (
                            <span className="text-slate-400 truncate">{item.brandName}</span>
                          )}
                        </div>

                        <h2 className="text-base font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition line-clamp-1">
                          {item.name}
                        </h2>

                        <p className="text-xs text-slate-500 line-clamp-1">
                          {item.genericName || 'Formulation certified'}
                        </p>

                        <div className="pt-1 flex items-center gap-2 text-xs text-slate-600">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                            {item.dosageForm || 'Dosage unit'}
                          </span>
                          {item.strength && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium">
                              {item.strength}
                            </span>
                          )}
                        </div>

                        {/* Seller info */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-2">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            Sold by:{' '}
                            <span className="font-semibold text-slate-700">
                              {item.sellerName || 'Verified Facility'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price and Cart controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                            Unit Price
                          </span>
                          <span className="text-lg font-extrabold text-slate-900">
                            Rs. {Number(item.price || 0).toFixed(2)}
                          </span>
                        </div>

                        {inStock && currentUser && (
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, -1, available)}
                              disabled={qty <= 1}
                              className="rounded-lg p-1 text-slate-600 hover:bg-white disabled:opacity-30 transition"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-slate-800">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => changeQuantity(item.id, 1, available)}
                              disabled={qty >= available}
                              className="rounded-lg p-1 text-slate-600 hover:bg-white disabled:opacity-30 transition"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/medicines/${item.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
                        >
                          Details
                        </Link>

                        {currentUser ? (
                          <button
                            type="button"
                            disabled={!inStock || isAdding}
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition shadow-2xs"
                          >
                            {isAdding ? 'Adding...' : inStock ? `Add to Cart` : 'Unavailable'}
                          </button>
                        ) : (
                          <Link
                            to="/login"
                            className="flex-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition text-center"
                          >
                            Sign In to Order
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )

  return currentUser ? content : <PublicLayout>{content}</PublicLayout>
}
