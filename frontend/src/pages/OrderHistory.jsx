import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, Truck, CheckCircle, XCircle, Clock, 
  ChevronRight, Search, Filter, ArrowRight 
} from 'lucide-react'
import { orderApi } from '../services/orders'

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)

  // Filter definitions for the tab bar
  const filterTabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' }
  ]

  useEffect(() => {
    fetchOrders()
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [filter, page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (filter !== 'all') {
        params.status = filter
      }
      
      // Artificial delay to show off the skeleton loader (remove in production)
      // await new Promise(resolve => setTimeout(resolve, 600))

      const data = await orderApi.getUserOrders(params)
      setOrders(data.orders || [])
      setTotalOrders(data.total || 0)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper: Status Styling
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': 
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle size={14} /> }
      case 'shipped': 
        return { bg: 'bg-blue-100', text: 'text-blue-700', icon: <Truck size={14} /> }
      case 'cancelled': 
        return { bg: 'bg-red-100', text: 'text-red-700', icon: <XCircle size={14} /> }
      default: 
        return { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock size={14} /> }
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(price)

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif text-slate-900 mb-2">My Orders</h1>
            <p className="text-slate-500">Track and manage your recent purchases</p>
          </div>
          <div className="text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            Total Orders: <span className="text-slate-900 font-bold">{totalOrders}</span>
          </div>
        </div>

        {/* Filter Tabs - Horizontal Scroll on Mobile */}
        <div className="sticky top-0 z-20 bg-stone-50/95 backdrop-blur-sm py-4 -mx-4 px-4 md:mx-0 md:px-0 mb-6 border-b border-slate-200 md:border-none">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setFilter(tab.id); setPage(1); }}
                className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  filter === tab.id
                    ? 'bg-slate-900 text-white shadow-md transform scale-105'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          // Skeleton Loader
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
                <div className="h-6 bg-slate-100 rounded w-1/3 mb-4"></div>
                <div className="flex gap-4 mb-4">
                  <div className="w-20 h-24 bg-slate-100 rounded-lg"></div>
                  <div className="w-20 h-24 bg-slate-100 rounded-lg"></div>
                </div>
                <div className="h-10 bg-slate-100 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Empty State
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center bg-white rounded-3xl p-12 text-center shadow-sm border border-slate-100 min-h-[400px]"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Package size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-serif text-slate-900 mb-2">No orders found</h2>
            <p className="text-slate-500 mb-8 max-w-sm">
              {filter === 'all' 
                ? "You haven't placed any orders yet. Start exploring our collection." 
                : `You don't have any ${filter} orders at the moment.`}
            </p>
            <Link 
              to="/products" 
              className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              Start Shopping <ArrowRight size={16} />
            </Link>
          </motion.div>
        ) : (
          // Order Grid
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode='popLayout'>
              {orders.map((order) => {
                const statusStyle = getStatusStyle(order.status)
                return (
                  <motion.div
                    layout
                    key={order._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-slate-100 hover:border-rose-100 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Header: Order ID & Status */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                          #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Placed on {formatDate(order.createdAt)}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${statusStyle.bg} ${statusStyle.text} border-transparent`}>
                        {statusStyle.icon} {order.status}
                      </div>
                    </div>

                    {/* Product Thumbnails */}
                    <div className="flex gap-3 mb-6 overflow-hidden">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="relative w-16 h-20 rounded-lg bg-slate-100 border border-slate-100 overflow-hidden flex-shrink-0">
                           {item.image || item.product?.images?.[0]?.url ? (
                            <img 
                              src={item.image || item.product?.images?.[0]?.url} 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                            />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">IMG</div>
                           )}
                           <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                             x{item.quantity}
                           </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-16 h-20 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium flex-shrink-0">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Footer: Total & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Total Amount</p>
                        <p className="text-lg font-bold text-slate-900">{formatPrice(order.totalAmount)}</p>
                      </div>
                      <Link 
                        to={`/orders/${order._id}`}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-colors flex items-center gap-2"
                      >
                        Details <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {orders.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-600 font-medium hover:bg-white hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-500">Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              // Assuming API returns total pages, or we disable if current fetch is less than limit
              disabled={orders.length < 10} 
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default OrderHistory