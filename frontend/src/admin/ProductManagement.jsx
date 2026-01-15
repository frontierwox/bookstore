import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, 
  Package, AlertTriangle, CheckCircle, XCircle, 
  ChevronLeft, ChevronRight, MoreVertical, RefreshCw 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { adminApi } from '../services/admin' // Using adminApi for full CRUD access

const ProductManagement = () => {
  // --- State ---
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState({ total: 0, outOfStock: 0, lowStock: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // --- Constants ---
  const CATEGORIES = [
    'silk', 'cotton', 'chiffon', 'georgette', 'crepe', 
    'banarasi', 'kanchipuram', 'bridal', 'other'
  ]

  // --- Debounce Search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Reset to page 1 on new search
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        category: categoryFilter,
        stockStatus: stockFilter // Assuming backend supports this
      }
      
      const data = await adminApi.getProducts(params)
      setProducts(data.products || [])
      setTotalPages(Math.ceil((data.total || 0) / 10))
      
      // Calculate quick stats from current batch (or fetch from dedicated endpoint)
      // Ideally, backend sends these stats. Simulating here:
      setStats({
        total: data.total || 0,
        outOfStock: (data.products || []).filter(p => p.stock === 0).length,
        lowStock: (data.products || []).filter(p => p.stock > 0 && p.stock < 10).length
      })

    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, debouncedSearch, categoryFilter, stockFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // --- Actions ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return

    const toastId = toast.loading('Deleting product...')
    try {
      await adminApi.deleteProduct(id)
      toast.success('Product deleted successfully', { id: toastId })
      fetchData() // Refresh list
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product', { id: toastId })
    }
  }

  // --- Helpers ---
  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
    if (stock < 10) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle }
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Product Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage catalog, inventory, and pricing.</p>
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleRefresh}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
            <Link 
              to="/admin/products/new" 
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-slate-900/20 hover:shadow-rose-500/30 font-medium"
            >
              <Plus size={20} /> Add Product
            </Link>
          </div>
        </div>

        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Total Products" 
            value={stats.total} 
            icon={<Package size={24} />} 
            color="blue"
            loading={loading && !products.length}
          />
          <StatCard 
            title="Low Stock Alert" 
            value={stats.lowStock} 
            icon={<AlertTriangle size={24} />} 
            color="amber"
            loading={loading && !products.length}
          />
          <StatCard 
            title="Out of Stock" 
            value={stats.outOfStock} 
            icon={<XCircle size={24} />} 
            color="red"
            loading={loading && !products.length}
          />
        </div>

        {/* --- Filters Bar --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, SKU..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">
             <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:border-rose-500"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
             </div>

             <div className="relative min-w-[140px]">
                <select 
                  value={stockFilter} 
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:border-rose-500"
                >
                  <option value="">All Stock Status</option>
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
             </div>
          </div>
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
             <TableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Product Details</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Stock Status</th>
                      <th className="px-6 py-4 text-center">Featured</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(product => {
                       const stockStatus = getStockStatus(product.stock)
                       const StockIcon = stockStatus.icon

                       return (
                        <tr key={product._id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* Product Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-16 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0">
                                {product.images?.[0] ? (
                                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20}/></div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h4>
                                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[150px]">ID: {product._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-4">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium capitalize border border-slate-200">
                              {product.category}
                            </span>
                          </td>

                          {/* Price */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              {product.discountedPrice ? (
                                <>
                                  <span className="font-bold text-slate-900">{formatPrice(product.discountedPrice)}</span>
                                  <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
                                </>
                              ) : (
                                <span className="font-bold text-slate-900">{formatPrice(product.price)}</span>
                              )}
                            </div>
                          </td>

                          {/* Stock */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${stockStatus.color}`}>
                                <StockIcon size={12} /> {stockStatus.label}
                              </span>
                              <span className="text-xs text-slate-500">({product.stock})</span>
                            </div>
                          </td>

                          {/* Featured */}
                          <td className="px-6 py-4 text-center">
                            {product.featured ? (
                              <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link 
                                to={`/products/${product._id}`} 
                                target="_blank"
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Live"
                              >
                                <Eye size={18} />
                              </Link>
                              <Link 
                                to={`/admin/products/${product._id}/edit`} 
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </Link>
                              <button 
                                onClick={() => handleDelete(product._id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                       )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                </span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Sub Components ---

const StatCard = ({ title, value, icon, color, loading }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
  }

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{title}</p>
        {loading ? (
          <div className="h-6 w-12 bg-slate-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-xl font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  )
}

const TableSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 gap-4">
        <div className="w-12 h-16 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
)

export default ProductManagement