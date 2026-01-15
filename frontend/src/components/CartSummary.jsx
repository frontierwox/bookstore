import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Tag, ShieldCheck, Truck, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const CartSummary = ({ cart, onCheckout, formatPrice }) => {
  // If no formatPrice prop is passed, use a default formatter
  const formatCurrency = formatPrice || ((price) => `₹${price.toLocaleString('en-IN')}`)

  const FREE_SHIPPING_THRESHOLD = 999
  const SHIPPING_COST = 50
  
  // Calculations
  const subtotal = cart?.totalAmount || 0
  const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
  const shipping = isFreeShipping ? 0 : SHIPPING_COST
  
  
  const total = subtotal + shipping 
  
  // Progress bar calculation
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const amountNeeded = FREE_SHIPPING_THRESHOLD - subtotal

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="font-serif text-xl font-bold text-slate-900 mb-6">Order Summary</h3>

      {/* --- Subtotal & Item Count --- */}
      <div className="flex justify-between items-center mb-4 text-slate-600">
        <span>Subtotal ({cart?.totalItems || 0} items)</span>
        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
      </div>

      {/* --- Shipping Logic & Progress Bar --- */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-slate-600 flex items-center gap-2">
            Shipping
          </span>
          <span className={isFreeShipping ? "text-green-600 font-medium" : "text-slate-900 font-medium"}>
            {isFreeShipping ? 'Free' : formatCurrency(SHIPPING_COST)}
          </span>
        </div>
      </div>

      {/* --- Divider --- */}
      <div className="border-t border-slate-100 mb-6 border-dashed" />

      <div className="border-t border-slate-100 mb-6" />

      {/* --- Total --- */}
      <div className="flex justify-between items-end mb-6">
        <span className="text-lg font-bold text-slate-900">Total Amount</span>
        <div className="text-right">
          <span className="text-2xl font-serif font-bold text-rose-600 block leading-none">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      {/* --- Checkout Button --- */}
      <button 
        onClick={onCheckout} 
        className="w-full group flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300 mb-3"
      >
        Proceed to Checkout 
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* --- Continue Shopping --- */}
      <Link 
        to="/products" 
        className="block w-full text-center py-3 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        Continue Shopping
      </Link>

      {/* --- Security Note --- */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-2 rounded-lg">
        <ShieldCheck size={14} className="text-emerald-500" />
        <span>Guaranteed Safe & Secure Checkout</span>
      </div>

    </div>
  )
}

export default CartSummary