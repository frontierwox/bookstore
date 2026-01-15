import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  IndianRupee, Package, Users, ShoppingBag, 
  Clock, AlertTriangle, Plus, FileText, 
  BarChart2, Layers, ArrowRight, RefreshCcw, Search
} from 'lucide-react';
import { adminApi } from '../services/admin';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDashboardStats();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // --- Loading Skeleton ---
  if (loading) {
    return <DashboardSkeleton />;
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Dashboard Error</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button onClick={fetchDashboardStats} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto">
            <RefreshCcw size={18} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back, Admin. Here's what's happening today.</p>
          </div>
          <button 
            onClick={fetchDashboardStats}
            className="self-start md:self-auto p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            title="Refresh Data"
          >
            <RefreshCcw size={20} />
          </button>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* --- Stat Cards Grid --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={formatPrice(stats?.totalRevenue)} 
              label="Lifetime earnings"
              icon={<IndianRupee size={24} />} 
              color="emerald"
            />
            <StatCard 
              title="Total Orders" 
              value={stats?.totalOrders || 0} 
              label="All time orders"
              icon={<Package size={24} />} 
              color="blue"
            />
            <StatCard 
              title="Total Users" 
              value={stats?.totalUsers || 0} 
              label="Registered accounts"
              icon={<Users size={24} />} 
              color="violet"
            />
            <StatCard 
              title="Active Products" 
              value={stats?.totalProducts || 0} 
              label="In catalog"
              icon={<ShoppingBag size={24} />} 
              color="pink"
            />
            <StatCard 
              title="Pending Orders" 
              value={stats?.pendingOrders || 0} 
              label="Needs attention"
              icon={<Clock size={24} />} 
              color="amber"
            />
            <StatCard 
              title="Low Stock" 
              value={stats?.lowStockProducts || 0} 
              label="Restock needed"
              icon={<AlertTriangle size={24} />} 
              color="rose"
            />
          </div>

          {/* --- Quick Actions --- */}
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction to="/admin/products/new" icon={<Plus size={24} />} title="Add Product" color="slate" />
              <QuickAction to="/admin/orders" icon={<FileText size={24} />} title="Manage Orders" color="blue" />
              <QuickAction to="/admin/analytics" icon={<BarChart2 size={24} />} title="Analytics" color="emerald" />
              <QuickAction to="/admin/stock" icon={<Layers size={24} />} title="Stock Control" color="amber" />
            </div>
          </motion.div>

          {/* --- Recent Orders Section --- */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm font-medium text-rose-600 hover:text-rose-700 flex items-center gap-1 group">
                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-500 font-medium">No recent orders found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">#{order.orderNumber}</td>
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold text-xs">
                              {order.user?.name?.charAt(0) || 'G'}
                            </div>
                            <span className="truncate max-w-[150px]">{order.user?.name || 'Guest'}</span>
                          </td>
                          <td className="px-6 py-4 font-medium">{formatPrice(order.totalAmount)}</td>
                          <td className="px-6 py-4">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link to={`/admin/orders/${order._id}`} className="text-rose-600 hover:text-rose-800 font-medium text-xs border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-full transition-all">
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards (Visible only on small screens) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-slate-400">#{order.orderNumber}</span>
                          <h4 className="font-semibold text-slate-900">{order.user?.name || 'Guest User'}</h4>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</span>
                        <span className="font-bold text-slate-900">{formatPrice(order.totalAmount)}</span>
                      </div>
                      <div className="pt-2">
                        <Link to={`/admin/orders/${order._id}`} className="block w-full text-center py-2 bg-slate-50 text-slate-700 font-medium text-sm rounded-lg hover:bg-slate-100 transition-colors">
                          View Order Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const StatCard = ({ title, value, label, icon, color }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
    pink: 'bg-pink-100 text-pink-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow group">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
      <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
    </div>
  );
};

const QuickAction = ({ to, icon, title, color }) => {
   const colors = {
    slate: 'group-hover:text-slate-600 group-hover:bg-slate-100',
    blue: 'group-hover:text-blue-600 group-hover:bg-blue-100',
    emerald: 'group-hover:text-emerald-600 group-hover:bg-emerald-100',
    amber: 'group-hover:text-amber-600 group-hover:bg-amber-100',
  };

  return (
    <Link to={to} className="group bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3">
      <div className={`p-3 rounded-full bg-slate-50 text-slate-500 transition-colors ${colors[color]}`}>
        {icon}
      </div>
      <span className="font-semibold text-slate-700 text-sm">{title}</span>
    </Link>
  )
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    processing: "bg-blue-50 text-blue-700 border-blue-100",
    shipped: "bg-indigo-50 text-indigo-700 border-indigo-100",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
    cancelled: "bg-red-50 text-red-700 border-red-100",
  };
  
  const statusKey = status?.toLowerCase() || 'pending';

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[statusKey] || styles.pending} capitalize`}>
      {status}
    </span>
  );
};

const DashboardSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 animate-pulse">
    <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-4 gap-4">
       {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-200 rounded-2xl"></div>
      ))}
    </div>
    <div className="h-64 bg-slate-200 rounded-2xl"></div>
  </div>
);

export default AdminDashboard;