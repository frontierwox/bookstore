import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, MapPin, CreditCard, Package, Truck, 
  CheckCircle, Clock, Calendar, AlertCircle, Loader2, ChevronRight 
} from 'lucide-react'
import { orderApi } from '../services/orders'

const OrderDetails = () => {
  const { id } = useParams()
  const location = useLocation()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const data = await orderApi.getOrderById(id)
        setOrder(data.order)
      } catch (e) {
        console.error('Failed to fetch order', e)
        setError(e.response?.data?.message || 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price || 0)

  // Helper to get color based on status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-amber-100 text-amber-700 border-amber-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium animate-pulse">Retrieving order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "We couldn't locate the order details you requested."}</p>
          <Link to="/orders" className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/orders" 
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 hover:text-rose-600 hover:border-rose-200 transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-slate-900 flex items-center gap-3">
                Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                <span className={`text-xs px-3 py-1 rounded-full border font-sans font-medium uppercase tracking-wide ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </h1>
              <div className="flex items-center text-slate-500 text-sm mt-1 gap-4">
                <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="flex items-center gap-1"><Clock size={14}/> {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          
          {location.state?.success && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-100 flex items-center gap-2 text-sm font-medium"
            >
              <CheckCircle size={16} /> Order placed successfully
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Items & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Items Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-rose-600" /> Order Items
                </h2>
                <span className="text-sm text-slate-500">{order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-slate-50/50 transition-colors">
                    <div className="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                      <img
                        src={item.image || item.product?.images?.[0]?.url || item.product?.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-serif text-lg text-slate-900">{item.name}</h3>
                          <div className="text-sm text-slate-500 mt-1 space-y-1">
                            {item.selectedSize && <p>Size: <span className="font-medium text-slate-700">{item.selectedSize}</span></p>}
                            {item.selectedColor && <p>Color: <span className="font-medium text-slate-700">{item.selectedColor}</span></p>}
                            <p>Qty: <span className="font-medium text-slate-700">{item.quantity}</span></p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-lg text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-slate-400">{formatPrice(item.price)} each</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Payment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-rose-600" /> Delivery Address
                </h3>
                <div className="space-y-1 text-slate-600 text-sm leading-relaxed">
                  <p className="font-medium text-slate-900 text-base mb-1">{order.shippingAddress?.name}</p>
                  <p>{order.shippingAddress?.address}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  <p className="font-medium">{order.shippingAddress?.pincode}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 text-slate-500">
                    Phone: <span className="text-slate-900">{order.shippingAddress?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-600" /> Payment Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Method</span>
                    <p className="font-medium text-slate-900 capitalize flex items-center gap-2 mt-1">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      {order.paymentMethod !== 'cod' && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Paid</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Payment Status</span>
                    <p className={`font-medium mt-1 ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'} capitalize`}>
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Summary & Timeline */}
          <div className="space-y-6">
            
            {/* Order Summary */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-serif text-lg text-slate-900 mb-4 pb-2 border-b border-slate-100">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.subtotal || order.originalSubtotal || order.totalAmount)}</span>
                </div>
                {order.discount > 0 && (
                   <div className="flex justify-between text-emerald-600 text-sm">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Shipping</span>
                  <span>{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Tax</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-xl font-serif font-bold text-rose-600">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="font-serif text-lg text-slate-900 mb-6 flex items-center gap-2">
                <Truck size={18} className="text-rose-600" /> Tracking Status
              </h3>
              
              {order.statusHistory?.length > 0 ? (
                <div className="relative pl-2">
                  {/* Vertical Line */}
                  <div className="absolute top-2 left-[7px] bottom-6 w-0.5 bg-slate-100" />
                  
                  <div className="space-y-8">
                    {order.statusHistory.map((history, idx) => (
                      <div key={idx} className="relative pl-8 group">
                        {/* Dot */}
                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 z-10 bg-white
                          ${idx === 0 ? 'border-rose-500 shadow-[0_0_0_4px_rgba(225,29,72,0.1)]' : 'border-slate-300'}`} 
                        />
                        
                        <div>
                          <p className={`font-medium ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                            {history.status}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(history.timestamp).toLocaleString('en-IN', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                          {history.note && (
                            <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                              {history.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-lg">
                  Order processing initiated
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails