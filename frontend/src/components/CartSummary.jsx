import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Tag, ShieldCheck, Truck, ChevronRight, Ticket, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

const CartSummary = ({ 
  cart, 
  onCheckout, 
  formatPrice, 
  onApplyCoupon, 
  appliedCoupon, // Passed from parent (Cart)
  onRemoveCoupon // Passed from parent (Cart)
}) => {
  // Use passed formatter or default
  const formatCurrency = formatPrice || ((price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(price))

  const FREE_SHIPPING_THRESHOLD = 999
  const SHIPPING_COST = 50
  const GST_RATE = 0.18

  // --- Local State for Input ---
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [isCouponExpanded, setIsCouponExpanded] = useState(false)

  // --- Calculations ---
  const subtotal = cart?.totalAmount || 0
  
  // Get applied discount from parent state
  const discount = appliedCoupon?.discountAmount || 0
  
  // 1. Shipping Logic (based on original subtotal)
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shipping = isFreeShipping ? 0 : SHIPPING_COST
  
  // 2. Progress Bar Calculation
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const amountNeeded = FREE_SHIPPING_THRESHOLD - subtotal

  // 3. Tax & Total (tax calculated on discounted amount)
  const taxableAmount = Math.max(0, subtotal - discount)
  const tax = Math.round(taxableAmount * GST_RATE * 100) / 100
  
  const total = Math.round(subtotal - discount + shipping + tax)

  // --- Handlers ---
  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim()
    
    if (!trimmedCode) {
      toast.error('Please enter a coupon code')
      return
    }
    
    setCouponLoading(true)
    
    try {
      // Call parent handler which validates with API
      await onApplyCoupon(trimmedCode)
      // Success is handled in parent, which updates appliedCoupon
      toast.success(`Coupon ${trimmedCode} applied!`)
      setCouponCode('') // Clear input on success
      setIsCouponExpanded(false) // Collapse input
    } catch (error) {
      // Extract and show error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Invalid or expired coupon code'
      toast.error(errorMessage)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon()
      setCouponCode('')
      toast.success('Coupon removed')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-24">
      <h3 className="font-serif text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        Order Summary
      </h3>

      {/* --- Subtotal --- */}
      <div className="flex justify-between items-center mb-4 text-slate-600 text-sm">
        <span>Subtotal ({cart?.totalItems || 0} items)</span>
        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
      </div>

      {/* --- Free Shipping Progress --- */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-semibold text-slate-700 flex items-center gap-2">
            <Truck size={16} className="text-rose-600" />
            {isFreeShipping ? 'Free Shipping Unlocked!' : 'Add items for Free Shipping'}
          </span>
          <span className="text-xs font-bold text-slate-500">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${isFreeShipping ? 'bg-emerald-500' : 'bg-rose-500'}`}
          />
        </div>
        
        {!isFreeShipping && (
          <p className="text-xs text-slate-500">
            Add <span className="font-bold text-slate-900">{formatCurrency(amountNeeded)}</span> more to save {formatCurrency(SHIPPING_COST)} on shipping
          </p>
        )}
      </div>

      {/* --- Coupon Section --- */}
      <div className="mb-6">
        {appliedCoupon ? (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600 shrink-0">
                <Ticket size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide truncate">
                  {appliedCoupon.code}
                </p>
                <p className="text-xs text-emerald-600">
                  Saved {formatCurrency(appliedCoupon.discountAmount)}
                </p>
              </div>
            </div>
            <button 
              onClick={handleRemoveCoupon} 
              className="text-emerald-400 hover:text-emerald-700 p-1 rounded-full hover:bg-emerald-100 transition-colors shrink-0"
              aria-label="Remove coupon"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 rounded-xl overflow-hidden">
            <button 
              onClick={() => setIsCouponExpanded(!isCouponExpanded)}
              className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Tag size={16} /> Have a coupon?
              </span>
              <ChevronRight 
                size={16} 
                className={`transition-transform duration-200 ${isCouponExpanded ? 'rotate-90' : ''}`}
              />
            </button>
            
            <AnimatePresence>
              {isCouponExpanded && (
                <motion.div 
                  initial={{ height: 0 }} 
                  animate={{ height: 'auto' }} 
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter code" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-300 transition-colors uppercase placeholder:normal-case"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[70px] flex items-center justify-center"
                    >
                      {couponLoading ? (
                        <Loader2 size={16} className="animate-spin"/>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- Totals Divider --- */}
      <div className="border-t border-slate-100 mb-4" />

      {/* --- Detailed Breakdown --- */}
      <div className="space-y-3 mb-6">
        {discount > 0 && (
          <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
            <span>Coupon Discount</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center text-sm text-slate-600">
          <span>Shipping</span>
          <span className={isFreeShipping ? "text-emerald-600 font-medium" : ""}>
            {isFreeShipping ? 'Free' : formatCurrency(SHIPPING_COST)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm text-slate-600">
          <span>Tax (GST 18%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 mb-4" />

      {/* --- Total --- */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-lg font-bold text-slate-900">Total Amount</span>
          <p className="text-xs text-slate-400 mt-1">Including GST</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-serif font-bold text-rose-600 block leading-none">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* --- Actions --- */}
      <button 
        onClick={onCheckout} 
        className="w-full group relative overflow-hidden flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300 mb-4"
      >
        <span className="relative z-10 flex items-center gap-2">
          Proceed to Checkout <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      <Link 
        to="/products" 
        className="block w-full text-center py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        Continue Shopping
      </Link>

      {/* --- Trust Badge --- */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 py-3 rounded-lg border border-slate-100">
        <ShieldCheck size={14} className="text-emerald-500" />
        Secure SSL Checkout
      </div>

    </div>
  )
}

export default CartSummary