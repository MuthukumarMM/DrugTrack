import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Minus, PackagePlus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { clearCart, setCartQuantity, subscribeCart } from '../../services/cartService'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'

function formatMoney(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`
}

export default function CartPage() {
  const { currentUser, role } = useAuth()
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [updating, setUpdating] = useState(false)
  const buyerBasePath = role === 'PHARMACY' ? '/pharmacy' : role === 'HOSPITAL' ? '/hospital' : ''

  useEffect(() => {
    if (!currentUser) return undefined
    return subscribeCart(currentUser.uid, setCart)
  }, [currentUser])

  const items = useMemo(() => cart?.items || [], [cart?.items])

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * Number(item.quantity || 0), 0),
    [items]
  )

  const shipping = subtotal > 500 || subtotal === 0 ? 0 : 40
  const total = subtotal + shipping

  const handleQuantityChange = async (inventoryId, currentQuantity, delta, maxAvailable) => {
    const nextQuantity = currentQuantity + delta
    if (nextQuantity < 1) {
      handleRemoveItem(inventoryId)
      return
    }
    if (maxAvailable && nextQuantity > maxAvailable) {
      toast.error(`Only ${maxAvailable} units available in stock.`)
      return
    }
    setUpdating(true)
    try {
      await setCartQuantity(currentUser.uid, inventoryId, nextQuantity)
    } catch (error) {
      toast.error(error.message || 'Could not update quantity.')
    } finally {
      setUpdating(false)
    }
  }

  const handleRemoveItem = async inventoryId => {
    setUpdating(true)
    try {
      await setCartQuantity(currentUser.uid, inventoryId, 0)
      toast.success('Item removed from cart.')
    } catch (error) {
      toast.error(error.message || 'Could not remove item.')
    } finally {
      setUpdating(false)
    }
  }

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to empty your cart?')) return
    setUpdating(true)
    try {
      await clearCart(currentUser.uid)
      toast.success('Cart cleared.')
    } catch (error) {
      toast.error(error.message || 'Could not clear cart.')
    } finally {
      setUpdating(false)
    }
  }

  if (!cart) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Medicine Cart"
        description="Review your selected pharmaceutical supplies and verify quantity limits before checkout."
      />

      {items.length === 0 ? (
        <section className="panel mt-6 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <ShoppingBag size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Your cart is currently empty</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
            Explore our controlled medicine catalogue to select verified pharmaceutical products and schedule safe deliveries.
          </p>
          <div className="mt-6">
            <Link
              to="/medicines"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition"
            >
              Browse Medicines
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Cart items list */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
              </span>
              <button
                type="button"
                onClick={handleClearCart}
                disabled={updating}
                className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
              {items.map(item => {
                const available = Number(item.availableQuantity || 0)
                const inStock = available >= Number(item.quantity)

                return (
                  <div
                    key={item.inventoryId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-18 w-18 shrink-0 items-center justify-center rounded-xl bg-slate-100 p-2 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.drugName}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <PackagePlus className="text-teal-600" size={28} />
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/medicines/${item.inventoryId}`}
                          className="font-bold text-slate-900 hover:text-teal-700 transition"
                        >
                          {item.drugName}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Unit Price: <span className="font-semibold text-slate-700">{formatMoney(item.unitPrice)}</span>
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                              inStock
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                            }`}
                          >
                            {inStock ? 'In Stock' : `Low Stock (${available} left)`}
                          </span>
                          {item.batchId && (
                            <span className="text-[11px] text-slate-400">
                              Batch: {item.batchId.slice(0, 10)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto gap-5">
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.inventoryId, item.quantity, -1, available)}
                          disabled={updating}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-xs hover:bg-slate-100 disabled:opacity-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.inventoryId, item.quantity, 1, available)}
                          disabled={updating || item.quantity >= available}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-slate-600 shadow-xs hover:bg-slate-100 disabled:opacity-50"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right min-w-[90px]">
                        <p className="text-base font-bold text-slate-900">
                          {formatMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0))}
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.inventoryId)}
                        disabled={updating}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Order Summary sidebar */}
          <aside>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-24">
              <h3 className="text-base font-bold text-slate-900">Order Summary</h3>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <dt>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</dt>
                  <dd className="font-semibold text-slate-900">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <dt>Standard Shipping</dt>
                  <dd className="font-semibold text-slate-900">
                    {shipping === 0 ? <span className="text-emerald-600">FREE</span> : formatMoney(shipping)}
                  </dd>
                </div>
                {shipping > 0 && (
                  <p className="text-[11px] text-teal-700 bg-teal-50 rounded-lg p-2">
                    Tip: Add {formatMoney(500 - subtotal)} more for free delivery.
                  </p>
                )}
                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-base font-bold text-slate-900">
                  <dt>Estimated Total</dt>
                  <dd className="text-lg text-teal-700">{formatMoney(total)}</dd>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => navigate(`${buyerBasePath}/checkout`)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>

              <Link
                to="/medicines"
                className="mt-3 block text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
