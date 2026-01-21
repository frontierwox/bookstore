import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, Tag, ShieldCheck, Truck, ChevronRight, 
  Ticket, X, Loader2, Receipt, Info, Building2, Lock 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'

const CartSummary = ({ 
  cart, 
  onCheckout, 
  formatPrice, 
  onApplyCoupon, 
  appliedCoupon, 
  onRemoveCoupon,
  // Optional override if parent wants to force a specific shipping cost (e.g. promo)
  shipping: forcedShippingProp 
}) => {
  const { user } = useContext(AuthContext)
  const isReseller = user?.role === 'reseller'

  // --- Formatter ---
  const formatCurrency = formatPrice || ((price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(price))

  // --- Local State ---
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [isCouponExpanded, setIsCouponExpanded] = useState(false)

  // --- CALCULATION LOGIC ---
  // 1. Base values come strictly from the Backend Cart Object
  const subtotal = cart?.subtotal || 0
  const totalTax = cart?.totalTax || 0
  const totalShipping = forcedShippingProp !== undefined 
    ? forcedShippingProp 
    : (cart?.totalShipping || 0)

  // 2. Coupon Logic (Retail Only)
  // If a coupon is applied in the UI, we subtract it from the Backend's Grand Total.
  // Note: cart.totalAmount from backend = Subtotal + Tax + Shipping. It usually doesn't include the temporary coupon discount.
  const backendGrandTotal = cart?.totalAmount || 0
  const discountAmount = (!isReseller && appliedCoupon) ? (appliedCoupon.discountAmount || 0) : 0
  
  // 3. Final Payable Amount
  const finalTotal = Math.max(0, backendGrandTotal - discountAmount)

  // --- Handlers ---
  const handleApplyCoupon = async () => {
    if (isReseller) return 
    
    const trimmedCode = couponCode.trim()
    if (!trimmedCode) {
      toast.error('Please enter a coupon code')
      return
    }
    
    setCouponLoading(true)
    try {
      await onApplyCoupon(trimmedCode)
      toast.success(`Coupon ${trimmedCode} applied!`)
      setCouponCode('') 
      setIsCouponExpanded(false) 
    } catch (error) {
      // Error is handled by parent or interceptor, but we catch here to stop loading state
      console.error(error)
    } finally {
      setCouponLoading(false)
    }
  }

  return (
    <div className={`rounded-2xl shadow-sm border p-5 md:p-6 ${
      isReseller ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'
    }`}>
      
      {/* --- Header --- */}
      <h3 className="font-serif text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        {isReseller ? (
          <>
            <Building2 className="text-indigo-600" size={20}/>
            Wholesale Summary
          </>
        ) : (
          'Order Summary'
        )}
      </h3>

      {/* --- Subtotal --- */}
      <div className="flex justify-between items-center mb-4 text-slate-600 text-sm">
        <span>Subtotal ({cart?.totalItems || cart?.items?.length || 0} items)</span>
        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
      </div>

      {/* --- Coupon Section (Hidden for Resellers) --- */}
      {!isReseller && (
        <div className="mb-6">
          {appliedCoupon ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
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
                onClick={onRemoveCoupon} 
                className="text-emerald-400 hover:text-emerald-700 p-1 rounded-full hover:bg-emerald-100 transition-colors shrink-0"
                title="Remove Coupon"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => setIsCouponExpanded(!isCouponExpanded)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Tag size={16} /> Apply Coupon
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
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rose-300 uppercase placeholder:normal-case w-full min-w-0"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="bg-slate-900 text-white px-3 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors min-w-[60px] flex items-center justify-center shrink-0"
                      >
                        {couponLoading ? <Loader2 size={16} className="animate-spin"/> : 'Add'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* --- Detailed Breakdown --- */}
      <div className="space-y-3 mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        {!isReseller && discountAmount > 0 && (
          <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
            <span>Discount Applied</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        
        {/* Shipping Line */}
        <div className="flex justify-between items-center text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-slate-400"/>
            <span>Shipping</span>
            {isReseller && (
              <div className="group relative">
                 <Info size={12} className="text-slate-400 cursor-help" />
                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                   Calculated based on weight & location.
                 </div>
              </div>
            )}
          </div>
          <span className={totalShipping === 0 ? "text-emerald-600 font-medium" : "font-medium text-slate-900"}>
            {totalShipping === 0 ? 'Free' : formatCurrency(totalShipping)}
          </span>
        </div>

        {/* Tax Line */}
        <div className="flex justify-between items-center text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <Receipt size={14} className="text-slate-400"/>
            <span>{isReseller ? 'GST (Input Credit)' : 'Tax (GST)'}</span>
          </div>
          <span className="font-medium text-slate-900">{formatCurrency(totalTax)}</span>
        </div>
      </div>

      <div className="border-t border-slate-200 mb-4" />

      {/* --- Total --- */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <span className="text-lg font-bold text-slate-900">Total Amount</span>
          <p className="text-xs text-slate-400 mt-1">
            {isReseller ? 'Total Investment (Inc. GST)' : 'Inclusive of all taxes'}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-2xl md:text-3xl font-serif font-bold block leading-none ${
            isReseller ? 'text-indigo-700' : 'text-rose-600'
          }`}>
            {formatCurrency(finalTotal)}
          </span>
        </div>
      </div>

      {/* --- Checkout Button --- */}
      <button 
        onClick={onCheckout} 
        disabled={!cart?.items || cart.items.length === 0}
        className={`w-full group relative overflow-hidden flex items-center justify-center gap-2 py-4 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all duration-300 mb-4 disabled:opacity-70 disabled:cursor-not-allowed ${
          isReseller 
            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/30' 
            : 'bg-slate-900 hover:bg-rose-600 hover:shadow-rose-500/30'
        }`}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isReseller ? 'Confirm Bulk Order' : 'Proceed to Checkout'} 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </span>
      </button>

      <Link 
        to={isReseller ? "/reseller/catalog" : "/products"} 
        className="block w-full text-center py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        {isReseller ? 'Add More Stock' : 'Continue Shopping'}
      </Link>

      {/* --- Trust Badge --- */}
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-white py-3 rounded-lg border border-slate-100">
        {isReseller ? (
           <>
             <Lock size={14} className="text-indigo-500" />
             B2B Secure Transaction
           </>
        ) : (
           <>
             <ShieldCheck size={14} className="text-emerald-500" />
             Secure SSL Checkout
           </>
        )}
      </div>

    </div>
  )
}

export default CartSummary