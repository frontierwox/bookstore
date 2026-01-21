import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { cartApi } from '../services/cart'
import { AuthContext } from '../context/AuthContext'
import CartSummary from '../components/CartSummary' 
import toast from 'react-hot-toast'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [updatingItems, setUpdatingItems] = useState(new Set())
  const [removingId, setRemovingId] = useState(null)
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  useEffect(() => {
    if (user) {
      if (user.role === 'reseller') {
        navigate('/reseller/cart', { replace: true })
        return
      }
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [user, navigate])

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart()
      setCart(data.cart)
      if (data.cart?.appliedCoupon) {
        setAppliedCoupon(data.cart.appliedCoupon)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error("Could not load cart")
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return
    if (updatingItems.has(item._id)) return;

    const oldCart = JSON.parse(JSON.stringify(cart))
    
    setCart(prev => ({
      ...prev,
      items: prev.items.map(i => i._id === item._id ? { ...i, quantity: newQuantity } : i)
    }))
    setUpdatingItems(prev => new Set(prev).add(item._id))

    try {
      // Use the specific line item ID or product ID if unavailable
      const targetId = item.product?._id || item._id; 
      const data = await cartApi.updateCartItem(targetId, newQuantity)
      
      if (data.success) {
        setCart(data.cart)
        if (appliedCoupon) await revalidateCoupon(data.cart)
      }
    } catch (error) {
      console.error('Update failed:', error)
      setCart(oldCart)
      toast.error(error.response?.data?.message || "Could not update quantity")
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(item._id)
        return next
      })
    }
  }

  const handleRemoveItem = async (itemId) => {
    // itemId passed here is the unique line item _id (from cart.items map)
    if (removingId) return;
    setRemovingId(itemId)

    try {
      // ✅ FIX: Use the specific line item ID directly.
      // This allows backend to filter by i._id === itemId, removing ONLY this specific variant/entry.
      // Previously, we calculated targetId which often resolved to Product ID, deleting all variants.
      const data = await cartApi.removeFromCart(itemId)
      
      if (data.success) {
        setCart(data.cart)
        toast.success("Item removed")
        if (appliedCoupon && data.cart.items.length > 0) {
          await revalidateCoupon(data.cart)
        } else if (data.cart.items.length === 0) {
          setAppliedCoupon(null)
        }
      }
    } catch (error) {
      toast.error("Failed to remove item")
    } finally {
      setRemovingId(null)
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all items?')) {
      try {
        await cartApi.clearCart()
        setCart({ ...cart, items: [], totalAmount: 0, totalItems: 0, subtotal: 0, totalTax: 0, totalShipping: 0 })
        setAppliedCoupon(null)
        toast.success("Cart cleared")
      } catch (error) {
        toast.error("Failed to clear cart")
      }
    }
  }

  const handleCouponCheck = async (code) => {
    try {
      const res = await cartApi.validateCoupon({
        code, 
        cartTotal: cart.totalAmount, 
        cartItems: cart.items 
      })
      const couponData = {
        code: res.couponCode || code,
        discountAmount: res.discountAmount || res.discount || 0
      }
      setAppliedCoupon(couponData)
      return couponData
    } catch (error) {
      setAppliedCoupon(null)
      throw error
    }
  }

  const revalidateCoupon = async (updatedCart) => {
    if (!appliedCoupon) return
    try {
      const res = await cartApi.validateCoupon({
        code: appliedCoupon.code,
        cartTotal: updatedCart.totalAmount,
        cartItems: updatedCart.items
      })
      if (res.discountAmount !== appliedCoupon.discountAmount) {
        setAppliedCoupon({
          code: res.couponCode || appliedCoupon.code,
          discountAmount: res.discountAmount || 0
        })
      }
    } catch (error) {
      setAppliedCoupon(null)
      toast.error("Coupon removed: Order value too low")
    }
  }

  const handleCheckout = () => {
    navigate('/checkout', { state: { appliedCoupon } })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(price)
  }

  // --- Helper: Get Image URL Correctly ---
  const getProductImage = (item) => {
    const images = item.product?.images;
    if (images && images.length > 0) {
      // Prioritize imageId for GridFS, fallback to url
      if (images[0].imageId) return `/api/images/${images[0].imageId}`;
      if (images[0].url) return images[0].url;
    }
    return '/placeholder.jpg'; // Or a default image path
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your bag...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-3xl font-serif text-slate-900 mb-3">Please Log In</h2>
        <p className="text-slate-500 max-w-md mb-8">Sign in to view your shopping bag.</p>
        <Link to="/login" className="px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg">
          Log In Now
        </Link>
      </div>
    )
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-serif text-slate-900 mb-3">Your Bag is Empty</h2>
          <Link to="/products" className="inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg">
            Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-6 md:py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-serif text-slate-900 mb-2">Shopping Bag</h1>
            <p className="text-slate-500 text-sm md:text-base">
              <span className="font-semibold text-slate-900">{cart.totalItems} items</span> in your cart
            </p>
          </div>
          <Link to="/products" className="text-rose-600 font-medium hover:text-rose-800 flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Continue Shopping
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 relative">
          <div className="w-full lg:w-2/3 space-y-4">
            <div className="hidden md:grid grid-cols-12 gap-4 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-2 px-4">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            <AnimatePresence mode='popLayout'>
              {cart.items.map((item) => (
                <motion.div
                  layout
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-white rounded-2xl p-3 md:p-4 shadow-sm border transition-all ${removingId === item._id ? 'border-red-200 bg-red-50' : 'border-slate-100 hover:border-rose-100'}`}
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                    <div className="w-full md:col-span-6 flex gap-3 md:gap-4">
                      
                      {/* --- FIXED IMAGE RENDER --- */}
                      <div className="w-20 h-24 md:w-24 md:h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100 relative border border-slate-100">
                        <img 
                          src={getProductImage(item)} 
                          alt={item.product?.name || "Product"} 
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/placeholder.jpg'; }} // Fallback on error
                        />
                        {(removingId === item._id || updatingItems.has(item._id)) && (
                           <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                             <Loader2 className="animate-spin text-rose-600 w-5 h-5" />
                           </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col justify-between py-1 flex-1 min-w-0">
                        <div>
                          <Link to={`/products/${item.product?._id}`} className="font-serif text-base md:text-lg text-slate-900 hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                            {item.product?.name || "Unknown Product"}
                          </Link>
                          <div className="text-xs md:text-sm text-slate-500 mt-1.5 space-y-0.5">
                            {item.selectedSize && <p>Size: <span className="text-slate-700 font-medium">{item.selectedSize}</span></p>}
                            {item.selectedColor && <p>Color: <span className="text-slate-700 font-medium">{item.selectedColor}</span></p>}
                            {(item.shippingAmount > 0 || item.taxAmount > 0) && (
                              <div className="hidden md:block text-[10px] text-slate-400 mt-1">
                                 {formatPrice(item.price)}
                                 {item.shippingAmount > 0 && ` + Ship`}
                                 {item.taxAmount > 0 && ` + Tax`}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:col-span-3 flex justify-between md:justify-center items-center mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-50">
                      <div className="flex items-center gap-2 md:gap-0 w-full md:w-auto justify-between md:justify-center">
                        <span className="md:hidden text-xs text-slate-400 font-medium uppercase tracking-wider">Quantity:</span>
                        <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                          <button onClick={() => handleQuantityChange(item, item.quantity - 1)} disabled={item.quantity <= 1 || removingId === item._id} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-rose-600 active:scale-95 disabled:opacity-50">
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-sm font-medium text-slate-900 select-none">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item, item.quantity + 1)} disabled={removingId === item._id} className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-rose-600 active:scale-95 disabled:opacity-50">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex md:col-span-3 flex-col justify-center items-end text-right">
                      <div className="font-medium text-lg text-slate-900">{formatPrice(item.price * item.quantity)}</div>
                      <button onClick={() => handleRemoveItem(item._id)} disabled={removingId === item._id} className="flex items-center text-xs font-medium text-slate-400 hover:text-red-500 mt-3 transition-colors px-2 py-1 rounded hover:bg-red-50">
                        <Trash2 size={14} className="mr-1.5" /> Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="pt-4 flex justify-end">
               <button onClick={handleClearCart} className="text-xs md:text-sm text-slate-400 hover:text-red-500 transition-colors underline decoration-slate-300 underline-offset-4">
                 Clear Shopping Bag
               </button>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="sticky top-24">
              <CartSummary 
                cart={cart} 
                onCheckout={handleCheckout}
                formatPrice={formatPrice}
                onApplyCoupon={handleCouponCheck}
                appliedCoupon={appliedCoupon}
                onRemoveCoupon={() => setAppliedCoupon(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart