import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, PackagePlus, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import { getMedicineImage } from '../../constants/medicineImages'
import { useAuth } from '../../context/AuthContext'
import { addToCart } from '../../services/cartService'
import { getCatalogueListing } from '../../services/catalogueService'
import { PublicLayout } from '../public/PublicPages'

export default function MedicineDetailsPage() {
  const { listingId } = useParams()
  const { currentUser } = useAuth()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    getCatalogueListing(listingId)
      .then(record => {
        if (!mounted) return
        if (!record) setError('Medicine listing was not found.')
        setItem(record)
      })
      .catch(err => {
        if (mounted) setError(err.message || 'Unable to load medicine details.')
      })
    return () => {
      mounted = false
    }
  }, [listingId])

  if (!item && !error) return <LoadingSpinner />

  const content = (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700" to="/medicines">
        <ArrowLeft size={17} />
        Back to medicines
      </Link>

      {error ? (
        <section className="panel mt-6 p-10 text-center">
          <h1 className="text-2xl font-bold text-slate-950">Listing unavailable</h1>
          <p className="mt-2 text-slate-500">{error}</p>
        </section>
      ) : (
        <section className="mt-6 grid gap-8 lg:grid-cols-[420px_1fr]">
          <div className="panel overflow-hidden">
            <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-50">
              {getMedicineImage(item) ? (
                <img className="h-full w-full object-cover" src={getMedicineImage(item)} alt={item.name} />
              ) : (
                <PackagePlus size={70} className="text-brand-600" />
              )}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-brand-700">{item.genericName || 'Generic name unavailable'}</p>
            <h1 className="mt-2 text-4xl font-bold text-slate-950">{item.name}</h1>
            <p className="mt-3 text-slate-600">{[item.brandName, item.strength, item.dosageForm].filter(Boolean).join(' | ')}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="panel p-4">
                <p className="text-xs text-slate-500">Price</p>
                <p className="mt-1 text-2xl font-bold">Rs. {Number(item.price || 0).toFixed(2)}</p>
              </div>
              <div className="panel p-4">
                <p className="text-xs text-slate-500">Availability</p>
                <p className={`mt-1 font-bold ${Number(item.availableQuantity || 0) > 0 ? 'text-teal-700' : 'text-red-600'}`}>
                  {Number(item.availableQuantity || 0) > 0 ? `${item.availableQuantity} units` : 'Out of stock'}
                </p>
              </div>
              <div className="panel p-4">
                <p className="text-xs text-slate-500">Prescription</p>
                <p className="mt-1 font-bold">{item.prescriptionRequired ? 'Required' : 'Not flagged'}</p>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 p-5">
              <p className="flex items-center gap-2 font-semibold text-teal-950">
                <ShieldCheck size={18} />
                Safety information
              </p>
              <p className="mt-2 text-sm leading-6 text-teal-900">
                DrugTrack shows controlled catalogue data only. Prescription-required medicines are clearly marked, and checkout
                remains server-authoritative for price and stock validation.
              </p>
            </section>

            <div className="mt-6 flex flex-wrap gap-3">
              {currentUser ? (
                <button
                  disabled={Number(item.availableQuantity || 0) <= 0}
                  onClick={() =>
                    addToCart(currentUser.uid, {
                      inventoryId: item.inventoryId,
                      drugId: item.drugId,
                      batchId: item.batchId,
                      quantity: 1,
                      unitPrice: Number(item.price || 0),
                      availableQuantity: Number(item.availableQuantity || 0),
                      drugName: item.name,
                      imageUrl: getMedicineImage(item),
                    })
                      .then(() => toast.success('Added to cart'))
                      .catch(err => toast.error(err.message))
                  }
                  className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  Add to cart
                </button>
              ) : (
                <Link className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white" to="/login">
                  Sign in to order
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  )

  return currentUser ? content : <PublicLayout>{content}</PublicLayout>
}
