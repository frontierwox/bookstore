import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, Eye, ChevronLeft, ChevronRight, 
  Download, RefreshCw, Calendar, CreditCard, 
  CheckCircle, Clock, Truck, AlertTriangle, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/admin';

// --- Configuration ---
const TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Processing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' }
];

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' }
];

const OrderManagement = () => {
  // --- State ---
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, pendingAction: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orderId: null,
    newStatus: '',
    currentStatus: ''
  });

  // --- Debounce Search ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        status: activeTab === 'all' ? undefined : activeTab
      };

      const data = await adminApi.getOrders(params);
      const allOrders = data.orders || [];
      
      setOrders(allOrders);
      setTotalPages(Math.ceil((data.total || 0) / 10));
      
      // --- UPDATED STATS LOGIC ---
      // Revenue: Only 'delivered' orders
      const completedRevenue = allOrders
        .filter(o => o.status === 'delivered')
        .reduce((acc, curr) => acc + curr.totalAmount, 0);

      // Pending Action: Active orders (Not delivered, Not cancelled)
      const pendingCount = allOrders
        .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
        .length;

      setStats({
        total: data.total || 0,
        pendingAction: pendingCount,
        revenue: completedRevenue
      });

    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // --- Actions ---
  
  // 1. Trigger Modal
  const requestStatusUpdate = (orderId, currentStatus, newStatus) => {
    // Prevent redundant updates
    if (currentStatus === newStatus) return;
    
    setConfirmModal({
      isOpen: true,
      orderId,
      currentStatus,
      newStatus
    });
  };

  // 2. Confirm & Execute Update
  const executeStatusUpdate = async () => {
    const { orderId, newStatus } = confirmModal;
    if (!orderId) return;

    const toastId = toast.loading('Updating status...');
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      
      // Optimistic update
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      
      // Re-fetch to update stats correctly if status changed to/from delivered/cancelled
      fetchData(); 

      toast.success(`Order marked as ${newStatus}`, { id: toastId });
      setConfirmModal({ isOpen: false, orderId: null, newStatus: '', currentStatus: '' });
    } catch (error) {
      toast.error('Update failed', { id: toastId });
    }
  };

  // --- Helpers ---
  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const formatDate = (dateString) => 
    new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">Order Management</h1>
            <p className="text-slate-500 text-sm mt-1">Track and manage customer orders efficiently.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm hover:shadow-md"
              title="Refresh Data"
            >
              <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all shadow-md hover:shadow-lg font-medium text-sm">
              <Download size={18} /> Export CSV
            </button>
          </div>
        </div>

        {/* --- Stats Overview --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Orders" value={stats.total} icon={<CheckCircle size={22} />} color="blue" />
          <StatCard label="Pending Action" value={stats.pendingAction} icon={<Clock size={22} />} color="amber" />
          <StatCard label="Completed Revenue" value={formatPrice(stats.revenue)} icon={<CreditCard size={22} />} color="emerald" />
        </div>

        {/* --- Controls Section --- */}
        <div className="bg-white rounded-t-2xl border border-slate-200 border-b-0 flex flex-col lg:flex-row items-center justify-between gap-4 p-4">
          
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar mask-gradient">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-slate-100 text-slate-900 font-semibold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search order ID, customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* --- Orders Table --- */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
             <TableSkeleton />
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Filter size={32} className="opacity-50" />
              </div>
              <p className="text-lg font-medium text-slate-600">No orders found</p>
              <p className="text-sm">Try changing filters or search terms</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Order ID</th>
                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                    <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                    <th className="px-6 py-4 whitespace-nowrap">Total</th>
                    <th className="px-6 py-4 whitespace-nowrap">Payment</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {orders.map((order) => (
                      <OrderRow 
                        key={order._id} 
                        order={order} 
                        formatDate={formatDate}
                        formatPrice={formatPrice}
                        onRequestUpdate={requestStatusUpdate}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && orders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-sm text-slate-500 font-medium">
                Page <span className="text-slate-900">{page}</span> of <span className="text-slate-900">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Confirmation Modal --- */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Update Order Status?</h3>
                  <p className="text-sm text-slate-500">This action will notify the customer.</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-semibold uppercase text-slate-700">{confirmModal.currentStatus}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">New Status:</span>
                  <span className="font-bold uppercase text-rose-600">{confirmModal.newStatus}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeStatusUpdate}
                  className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

// --- Sub Components ---

const StatCard = ({ label, value, icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3.5 rounded-xl border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
};

const OrderRow = ({ order, formatDate, formatPrice, onRequestUpdate }) => {
  const statusStyles = {
    pending: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    confirmed: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    processing: 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200',
    shipped: 'bg-purple-100 text-purple-700 ring-1 ring-purple-200',
    delivered: 'bg-emerald-100 text-emerald-700 ring-0 ring-emerald-200',
    cancelled: 'bg-red-50 text-red-600 ring-1 ring-red-100'
  };

  const paymentStyles = {
    paid: 'text-emerald-600 bg-emerald-50 ring-1 ring-emerald-100',
    pending: 'text-amber-600 bg-amber-50 ring-1 ring-amber-100',
    failed: 'text-red-600 bg-red-50 ring-1 ring-red-100'
  };

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="hover:bg-slate-50 transition-colors group"
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="font-mono font-medium text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded">
          #{order.orderNumber}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" /> 
          {formatDate(order.createdAt)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">{order.user?.name || 'Guest'}</span>
          <span className="text-xs text-slate-400">{order.customerEmail}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">
        {formatPrice(order.totalAmount)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${paymentStyles[order.paymentStatus] || 'text-slate-500 bg-slate-50'}`}>
          {order.paymentStatus}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative">
          <select 
            value={order.status}
            onChange={(e) => onRequestUpdate(order._id, order.status, e.target.value)}
            className={`
              pl-4 pr-0.5 py-1.5 rounded-full text-xs font-bold uppercase cursor-pointer outline-none appearance-none transition-all
              focus:ring-2 focus:ring-offset-1 focus:ring-slate-200
              ${statusStyles[order.status] || 'bg-slate-100 text-slate-600'}
            `}
          >
            {ORDER_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <Link 
          to={`/admin/orders/${order._id}`} 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm transition-all text-xs font-semibold"
        >
          <Eye size={14} /> View
        </Link>
      </td>
    </motion.tr>
  );
};

const TableSkeleton = () => (
  <div className="w-full">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center px-6 py-5 border-b border-slate-50 gap-4 animate-pulse">
        <div className="h-5 bg-slate-100 rounded w-20" />
        <div className="h-5 bg-slate-100 rounded w-28" />
        <div className="h-5 bg-slate-100 rounded w-40" />
        <div className="h-5 bg-slate-100 rounded w-20" />
        <div className="h-5 bg-slate-100 rounded w-24" />
        <div className="h-5 bg-slate-100 rounded w-28 ml-auto" />
      </div>
    ))}
  </div>
);

export default OrderManagement;