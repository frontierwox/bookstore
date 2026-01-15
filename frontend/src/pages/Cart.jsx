import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { cartApi } from '../services/cart'
import { AuthContext } from '../context/AuthContext'
import CartSummary from '../components/CartSummary' 
import toast from 'react-hot-toast' // Recommended for better UX

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null) 
  const [removingId, setRemovingId] = useState(null)

  useEffect(() => {
    if (user) {
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart()
      setCart(data.cart)
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error("Could not load cart")
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (item, newQuantity) => {
    if (newQuantity < 1) return
    
    // Optimistic UI check: prevent spamming
    if (updatingId) return;

    setUpdatingId(item._id)
    
    try {
      // Pass item._id (Cart Item ID) which matches our backend route expectation
      const data = await cartApi.updateCartItem(item._id, { quantity: newQuantity })
      
      if (data.success) {
        setCart(data.cart)
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      // Extract error message from backend if available
      const msg = error.response?.data?.message || "Could not update quantity";
      toast.error(msg)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveItem = async (itemId) => {
    if (removingId) return;
    setRemovingId(itemId)

    try {
      const data = await cartApi.removeFromCart(itemId)
      if (data.success) {
        setCart(data.cart)
        toast.success("Item removed")
      }
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error("Failed to remove item")
    } finally {
      setRemovingId(null)
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to remove all items?')) {
      try {
        await cartApi.clearCart()
        setCart({ ...cart, items: [] })
        toast.success("Cart cleared")
      } catch (error) {
        console.error('Error clearing cart:', error)
      }
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Loading your bag...</p>
      </div>
    )
  }

  // --- Not Logged In State ---
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-rose-600" />
        </div>
        <h2 className="text-3xl font-serif text-slate-900 mb-3">Please Log In</h2>
        <p className="text-slate-500 max-w-md mb-8">
          Sign in to view your cart items and sync them across all your devices.
        </p>
        <Link to="/login" className="px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg">
          Log In Now
        </Link>
      </div>
    )
  }

  // --- Empty Cart State ---
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-sm mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-3xl font-serif text-slate-900 mb-3">Your Bag is Empty</h2>
          <p className="text-slate-500 mb-8">Looks like you haven't added any beautiful sarees yet.</p>
          <Link to="/products" className="inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-full hover:bg-rose-700 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300">
            Start Shopping <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    )
  }

  // --- Main Cart UI ---
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif text-slate-900 mb-2">Shopping Bag</h1>
            <p className="text-slate-500">
              <span className="font-semibold text-slate-900">{cart.items.length} items</span> in your cart
            </p>
          </div>
          <Link to="/products" className="text-rose-600 font-medium hover:text-rose-800 flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Continue Shopping
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 relative">
          
          {/* Left Column: Cart Items */}
          <div className="w-full lg:w-2/3 space-y-4">
            {/* Header Row (Desktop) */}
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
                  transition={{ duration: 0.3 }}
                  className={`bg-white rounded-2xl p-4 shadow-sm border transition-colors ${
                    removingId === item._id ? 'border-red-200 bg-red-50' : 'border-slate-100 hover:border-rose-100'
                  }`}
                >
                  <div className="flex flex-col md:grid md:grid-cols-12 gap-4 items-center">
                    
                    {/* Product Info */}
                    <div className="w-full md:col-span-6 flex gap-4">
                      <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100 relative">
                        {item.product?.images?.[0] ? (
                          <img 
                            src={item.product.images[0].url} 
                            alt={item.product.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                        )}
                        {/* Overlay when removing */}
                        {removingId === item._id && (
                           <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                              <Loader2 className="animate-spin text-red-500" />
                           </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between py-1">
                        <div>
                          <Link to={`/products/${item.product?._id}`} className="font-serif text-lg text-slate-900 hover:text-rose-600 transition-colors line-clamp-1">
                            {item.product?.name}
                          </Link>
                          <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                            {item.selectedSize && <p>Size: <span className="text-slate-700">{item.selectedSize}</span></p>}
                            {item.selectedColor && <p>Color: <span className="text-slate-700">{item.selectedColor}</span></p>}
                          </div>
                        </div>
                        <div className="md:hidden font-medium text-slate-900 mt-2">
                          {formatPrice(item.price)}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="w-full md:col-span-3 flex justify-between md:justify-center items-center mt-4 md:mt-0">
                      <span className="md:hidden text-sm text-slate-500">Qty:</span>
                      <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
                        <button 
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updatingId === item._id || removingId === item._id}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        
                        <span className="w-10 text-center text-sm font-medium text-slate-900">
                          {updatingId === item._id ? (
                            <Loader2 size={12} className="animate-spin mx-auto text-rose-600"/> 
                          ) : (
                            item.quantity
                          )}
                        </span>
                        
                        <button 
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          disabled={updatingId === item._id || removingId === item._id}
                          className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="w-full md:col-span-3 flex md:flex-col justify-between md:justify-center items-end mt-4 md:mt-0">
                      <div className="text-right">
                         {/* Desktop Price */}
                        <div className="hidden md:block font-medium text-lg text-slate-900">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {/* Mobile Total Label */}
                        <div className="md:hidden font-medium text-lg text-slate-900">
                          <span className="text-sm text-slate-500 font-normal mr-2">Total:</span>
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleRemoveItem(item._id)}
                        disabled={removingId === item._id}
                        className="flex items-center text-sm text-red-500 hover:text-red-700 mt-2 px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} className="mr-1.5" />
                        <span className="hidden md:inline">{removingId === item._id ? 'Removing...' : 'Remove'}</span>
                        <span className="md:hidden">{removingId === item._id ? '...' : 'Remove'}</span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="pt-4 flex justify-end">
               <button 
                  onClick={handleClearCart} 
                  className="text-sm text-slate-400 hover:text-red-500 transition-colors underline decoration-slate-300 underline-offset-4"
               >
                 Clear Shopping Bag
               </button>
            </div>
          </div>

          {/* Right Column: Summary (Sticky) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-24">
              <CartSummary cart={cart} onCheckout={() => navigate('/checkout')} formatPrice={formatPrice} />
              
              {/* Trust Badges */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
                  <ShieldCheck size={20} className="text-emerald-500" />
                  <span className="text-[10px] text-slate-500 font-medium">Authentic</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
                  <Lock size={20} className="text-blue-500" />
                  <span className="text-[10px] text-slate-500 font-medium">Secure</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl shadow-sm">
                  <AlertCircle size={20} className="text-amber-500" />
                  <span className="text-[10px] text-slate-500 font-medium">Support</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default Cart