import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Edit, Trash2, Tag, 
  TrendingDown, Package, AlertTriangle, 
  ChevronLeft, ChevronRight, X, Percent, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/admin';

// --- Constants ---
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'silk', label: 'Silk' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'chiffon', label: 'Chiffon' },
  { value: 'georgette', label: 'Georgette' },
  { value: 'crepe', label: 'Crepe' },
  { value: 'banarasi', label: 'Banarasi' },
  { value: 'kanchipuram', label: 'Kanchipuram' },
  { value: 'bridal', label: 'Bridal' },
  { value: 'other', label: 'Other' }
];

const ProductManagementDashboard = () => {
  // --- State ---
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDiscount, setFilterDiscount] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [editingDiscountProduct, setEditingDiscountProduct] = useState(null);

  // --- Debounce Search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        category: filterCategory,
        hasDiscount: filterDiscount === 'yes' ? true : filterDiscount === 'no' ? false : undefined
      };
      
      const response = await adminApi.getProducts(params);
      setProducts(response.products || []);
      setTotalPages(Math.ceil((response.total || 0) / 10));
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterCategory, filterDiscount]);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Stats Error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchStats();
  }, []);

  // --- Handlers ---
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;

    const toastId = toast.loading('Deleting product...');
    try {
      await adminApi.deleteProduct(productId);
      toast.success('Product deleted', { id: toastId });
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete product', { id: toastId });
    }
  };

  const handleUpdateDiscount = async (productId, discountData) => {
    const toastId = toast.loading('Updating discount...');
    try {
      await adminApi.updateProductDiscount(productId, discountData);
      toast.success('Discount updated', { id: toastId });
      setEditingDiscountProduct(null);
      fetchData();
      fetchStats();
    } catch (error) {
      toast.error('Failed to update discount', { id: toastId });
    }
  };

  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Product Management</h1>
            <p className="text-slate-500 text-sm mt-1">Manage catalog, inventory, and pricing strategies.</p>
          </div>
          <Link 
            to="/admin/products/new" 
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-rose-600 transition-all shadow-lg shadow-slate-900/20 hover:shadow-rose-500/30"
          >
            <Plus size={20} /> Add Product
          </Link>
        </div>

        {/* --- Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Products" 
            value={stats?.totalProducts || 0} 
            icon={<Package size={24} />} 
            color="blue" 
            loading={statsLoading} 
          />
          <StatCard 
            title="Active Discounts" 
            value={stats?.productsWithDiscounts || 0} 
            icon={<Tag size={24} />} 
            color="emerald" 
            loading={statsLoading} 
          />
          <StatCard 
            title="Low Stock" 
            value={stats?.lowStockProducts || 0} 
            icon={<AlertTriangle size={24} />} 
            color="amber" 
            loading={statsLoading} 
          />
          <StatCard 
            title="Out of Stock" 
            value={products.filter(p => p.stock === 0).length} 
            icon={<TrendingDown size={24} />} 
            color="rose" 
            loading={statsLoading} 
          />
        </div>

        {/* --- Toolbar --- */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-3 overflow-x-auto pb-2 md:pb-0">
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:border-rose-500"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <select 
              value={filterDiscount}
              onChange={(e) => setFilterDiscount(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:border-rose-500"
            >
              <option value="">All Promotions</option>
              <option value="yes">Discounted</option>
              <option value="no">Regular Price</option>
            </select>
          </div>
        </div>

        {/* --- Product Table --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
             <TableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Package size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <ProductRow 
                      key={product._id} 
                      product={product} 
                      formatPrice={formatPrice}
                      onDelete={handleDeleteProduct}
                      onEditDiscount={() => setEditingDiscountProduct(product)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && products.length > 0 && (
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
          )}
        </div>
      </div>

      {/* --- Discount Modal --- */}
      <AnimatePresence>
        {editingDiscountProduct && (
          <DiscountModal 
            product={editingDiscountProduct}
            onClose={() => setEditingDiscountProduct(null)}
            onSave={handleUpdateDiscount}
            formatPrice={formatPrice}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

// --- Sub Components ---

const StatCard = ({ title, value, icon, color, loading }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
        ) : (
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        )}
      </div>
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
};

const ProductRow = ({ product, formatPrice, onDelete, onEditDiscount }) => {
  const finalPrice = product.price - (product.price * (product.discountPercentage || 0) / 100);
  
  const getStockStatus = (stock) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200' };
    if (stock < 10) return { label: 'Low Stock', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    return { label: 'In Stock', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const stockStatus = getStockStatus(product.stock);

  // LOGIC FIX: Determine Image Source
  const imageSource = product.images?.[0]?.imageId 
    ? `/api/images/${product.images[0].imageId}` 
    : product.images?.[0]?.url 
    ? product.images[0].url 
    : null;

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
            {imageSource ? (
              <img src={imageSource} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={20} /></div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {product._id.slice(-6)}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium capitalize border border-slate-200">
          {product.category}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{formatPrice(finalPrice)}</span>
          {product.discountPercentage > 0 && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col items-start gap-1">
          <span className="font-bold text-slate-700">{product.stock} units</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        {product.discountPercentage > 0 ? (
          <div className="flex items-center gap-2">
            <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-bold border border-rose-200">
              {product.discountPercentage}% OFF
            </span>
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">None</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEditDiscount}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" 
            title="Manage Discount"
          >
            <Tag size={18} />
          </button>
          <Link 
            to={`/admin/products/${product._id}/edit`}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
            title="Edit Details"
          >
            <Edit size={18} />
          </Link>
          <button 
            onClick={() => onDelete(product._id)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
            title="Delete Product"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const DiscountModal = ({ product, onClose, onSave, formatPrice }) => {
  const [percent, setPercent] = useState(product.discountPercentage || 0);
  const [start, setStart] = useState(product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '');
  const [end, setEnd] = useState(product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '');

  const finalPrice = product.price - (product.price * percent / 100);

  // Helper for image preview in modal
  const imageSource = product.images?.[0]?.imageId 
    ? `/api/images/${product.images[0].imageId}` 
    : product.images?.[0]?.url;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(product._id, {
      discountPercentage: Number(percent),
      discountStartDate: start || null,
      discountEndDate: end || null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-900">Manage Discount</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
            {imageSource && (
              <img src={imageSource} alt="" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">{product.name}</p>
              <p className="text-xs text-slate-500">Base Price: {formatPrice(product.price)}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Percentage Off</label>
            <div className="relative">
              <Percent size={18} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="number" 
                min="0" 
                max="100" 
                value={percent} 
                onChange={(e) => setPercent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
              <input 
                type="date" 
                value={start} 
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
              <input 
                type="date" 
                value={end} 
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex justify-between items-center">
            <span className="text-rose-800 text-sm font-medium">New Price</span>
            <div className="text-right">
              <span className="block text-2xl font-bold text-rose-600">{formatPrice(finalPrice)}</span>
              {percent > 0 && <span className="text-xs text-rose-400">Save {formatPrice(product.price - finalPrice)}</span>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20">Update</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const TableSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductManagementDashboard;