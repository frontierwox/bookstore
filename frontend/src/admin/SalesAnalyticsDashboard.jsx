import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Truck, 
  Download, Filter, Calendar, Search, Eye, Mail, RefreshCw, 
  Package, CheckCircle, Clock, XCircle 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/admin';

// --- Theme Configuration ---
const COLORS = {
  primary: '#e11d48', // Rose-600
  secondary: '#475569', // Slate-600
  grid: '#f1f5f9',
  pie: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'] // Blue, Violet, Emerald, Amber, Red
};

const SalesAnalyticsDashboard = () => {
  // --- State ---
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  
  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // --- Data Fetching ---
  const loadDashboardData = async () => {
    try {
      const [analyticsData, ordersData] = await Promise.all([
        adminApi.getAnalyticsOverview({ period }),
        adminApi.getOrders({ page: currentPage, limit: 50 }) // Fetching more for local filtering demo
      ]);
      setAnalytics(analyticsData.analytics);
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Dashboard Load Error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  // --- Handlers ---
  const handleStatusUpdate = async (orderId, newStatus) => {
    const previousOrders = [...orders];
    // Optimistic Update
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      setOrders(previousOrders);
      toast.error('Failed to update status');
    }
  };

  // --- Memoized Data ---
  
  // 1. Filtered Orders Table
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.user?.name?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // 2. Revenue Chart Data
  const revenueChartData = useMemo(() => {
    if (!analytics?.monthlySales) return [];
    return analytics.monthlySales.map(m => ({
      name: new Date(2024, m._id.month - 1).toLocaleString('default', { month: 'short' }),
      revenue: m.revenue,
      orders: m.count
    }));
  }, [analytics]);

  // 3. Status Distribution Data (Pie Chart) 
  const statusDistribution = useMemo(() => {
    const stats = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(o => {
      const s = o.status.toLowerCase();
      if (stats[s] !== undefined) stats[s]++;
    });

    return [
      { name: 'Pending', value: stats.pending },
      { name: 'Processing', value: stats.processing },
      { name: 'Shipped', value: stats.shipped },
      { name: 'Delivered', value: stats.delivered },
      { name: 'Cancelled', value: stats.cancelled },
    ].filter(item => item.value > 0); // Only show active statuses
  }, [orders]);

  // --- Helpers ---
  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);

  if (loading && !isRefreshing) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* --- Header --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">Sales Analytics</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2 text-sm">
              <Calendar size={14} /> 
              Overview for <span className="font-semibold text-slate-900 capitalize">{period}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Tabs */}
            <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              {['week', 'month', 'year'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                    period === p 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button 
              onClick={handleRefresh}
              className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            
            <button className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-md shadow-rose-200 font-medium text-sm">
              <Download size={16} /> Export Report
            </button>
          </div>
        </div>

        {/* --- KPI Grid (3 Columns) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KPICard 
            title="Total Revenue" 
            value={formatPrice(analytics?.overview?.revenue?.current)} 
            growth={analytics?.overview?.revenue?.growth}
            icon={<DollarSign size={24} />}
            color="emerald"
            period={period}
          />
          <KPICard 
            title="Total Orders" 
            value={analytics?.overview?.orders?.current || 0} 
            growth={analytics?.overview?.orders?.growth}
            icon={<ShoppingBag size={24} />}
            color="blue"
            period={period}
          />
          <KPICard 
            title="Avg. Order Value" 
            value={formatPrice(analytics?.overview?.averageOrderValue?.current)} 
            growth={analytics?.overview?.averageOrderValue?.growth}
            icon={<Truck size={24} />}
            color="violet"
            period={period}
          />
        </div>

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          
          {/* Main Revenue Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Revenue Trend</h3>
                <p className="text-sm text-slate-500">Income performance over time</p>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.grid} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: COLORS.secondary, fontSize: 12}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: COLORS.secondary, fontSize: 12}} 
                    tickFormatter={(value) => `₹${value/1000}k`} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatPrice(value), 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke={COLORS.primary} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Status Distribution (Replacing Discounts) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Order Status</h3>
            <p className="text-sm text-slate-500 mb-6">Distribution of current orders</p>

            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.pie[index % COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                <div className="text-center">
                  <span className="block text-2xl font-bold text-slate-900">{orders.length}</span>
                  <span className="text-xs text-slate-500 uppercase font-semibold">Total</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Recent Orders Table --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-900">Recent Orders</h3>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none w-full sm:w-64 transition-all"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length > 0 ? filteredOrders.slice((currentPage - 1) * 10, currentPage * 10).map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{order.user?.name || 'Guest'}</div>
                      <div className="text-xs text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => window.open(`/admin/orders/${order._id}`, '_blank')}
                           className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                         >
                           <Eye size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <Package size={48} className="mx-auto mb-3 opacity-20" />
                      No orders found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Simple Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p-1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-100"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentPage(p => p+1)}
              disabled={filteredOrders.length <= currentPage * 10}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub Components ---

const KPICard = ({ title, value, growth, icon, color, period }) => {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
  };

  const isPositive = growth >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
        <div className={`
          flex items-center gap-1 font-bold text-xs px-2 py-1 rounded-full
          ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}
        `}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(growth || 0).toFixed(1)}%
        </div>
      </div>
      
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-amber-100 text-amber-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-50 text-red-600',
  };
  
  const icons = {
    pending: <Clock size={12} />,
    delivered: <CheckCircle size={12} />,
    cancelled: <XCircle size={12} />,
  };

  const s = status?.toLowerCase() || 'pending';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${styles[s] || 'bg-slate-100 text-slate-600'}`}>
      {icons[s]} {status}
    </span>
  );
};

const DashboardSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-8">
    <div className="max-w-[1600px] mx-auto space-y-8 animate-pulse">
      <div className="h-10 bg-slate-200 rounded w-1/4 mb-8"></div>
      <div className="grid grid-cols-3 gap-6">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-200 rounded-2xl"></div>)}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-96 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

export default SalesAnalyticsDashboard;