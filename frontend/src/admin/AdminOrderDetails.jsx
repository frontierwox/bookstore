import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Mail, Truck, MapPin, 
  User, CreditCard, Calendar, ChevronDown, CheckCircle, 
  AlertTriangle, Loader2, X, Package, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/admin';
import toast from 'react-hot-toast';

const AdminOrderDetails = () => {
  const { id } = useParams();
  
  // --- State ---
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Action State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Modal State (Unified for both Status and Email actions)
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    type: null, // 'status' | 'email'
    data: null, // the status string or email type string
    isLoading: false
  });

  // --- Effects ---
  useEffect(() => {
    fetchOrder();
    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line
  }, [id]);

  // --- Handlers ---
  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrderDetails(id);
      setOrder(data.order);
    } catch (e) {
      console.error('Failed to fetch order', e);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  // 1. Trigger Confirmation Modal
  const requestAction = (type, data) => {
    setIsDropdownOpen(false); // Close dropdown if open
    
    // Prevent updating to the same status
    if (type === 'status' && order.status === data) return;

    setConfirmation({
      isOpen: true,
      type,
      data,
      isLoading: false
    });
  };

  // 2. Execute Action
  const executeAction = async () => {
    setConfirmation(prev => ({ ...prev, isLoading: true }));
    const { type, data } = confirmation;

    try {
      if (type === 'status') {
        await adminApi.updateOrderStatus(id, { status: data });
        await fetchOrder(); // Refresh data
        toast.success(`Order status updated to ${data}`);
      } else if (type === 'email') {
        await adminApi.resendOrderEmail(id, { emailType: data });
        toast.success(`${data} email sent successfully`);
      }
      setConfirmation({ isOpen: false, type: null, data: null, isLoading: false });
    } catch (e) {
      console.error(e);
      toast.error(`Failed to ${type === 'status' ? 'update status' : 'send email'}`);
      setConfirmation(prev => ({ ...prev, isLoading: false }));
    }
  };

  // --- Helpers ---
  const formatPrice = (price) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price || 0);

  const getMapUrl = () => {
    if (!order?.shippingAddress) return '#';
    const query = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // --- Render: Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading details...</p>
      </div>
    );
  }

  // --- Render: Not Found ---
  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Order Not Found</h3>
          <p className="text-slate-500 mb-6">The order ID provided does not exist or has been deleted.</p>
          <Link to="/admin/orders" className="inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors w-full font-medium">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans print:bg-white print:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print:pt-0 print:px-0">
        
        {/* --- Header --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  #{order.orderNumber}
                </h1>
                <StatusBadge status={order.status} size="large" />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                <Calendar size={14} />
                <span>{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all text-sm font-medium shadow-sm"
            >
              <Printer size={18} /> Print Slip
            </button>
            
            {/* Action Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all text-sm font-medium shadow-lg shadow-slate-900/20"
              >
                <span>Update Status</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
                  >
                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Select New Status
                    </div>
                    <div className="p-1">
                      {['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => requestAction('status', status.toLowerCase())}
                          disabled={order.status === status.toLowerCase()}
                          className={`
                            w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between
                            ${order.status === status.toLowerCase() 
                              ? 'bg-slate-50 text-slate-400 cursor-default' 
                              : 'text-slate-700 hover:bg-slate-50 hover:text-rose-600'}
                          `}
                        >
                          {status}
                          {order.status === status.toLowerCase() && <CheckCircle size={14} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
          
          {/* --- LEFT COLUMN (Main Details) --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border print:shadow-none">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Package size={18} className="text-slate-400" /> Order Items
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                  {order.items.length} Items
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 w-1/2">Product</th>
                      <th className="px-6 py-3 text-center">Price</th>
                      <th className="px-6 py-3 text-center">Qty</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{item.name}</div>
                          <div className="text-slate-500 text-xs mt-1 flex gap-2">
                            {item.selectedSize && <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Size: {item.selectedSize}</span>}
                            {item.selectedColor && <span className="inline-block bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Color: {item.selectedColor}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">{formatPrice(item.price)}</td>
                        <td className="px-6 py-4 text-center text-slate-600 font-mono">{item.quantity}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Totals Section */}
              <div className="px-6 py-5 bg-slate-50/30 border-t border-slate-100">
                <div className="max-w-xs ml-auto space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Item Total</span>
                    <span className="font-medium text-slate-700">{formatPrice(order.originalSubtotal || order.subtotal)}</span>
                  </div>
                  {(order.discountApplied > 0 || order.discount > 0) && (
                    <div className="flex justify-between text-emerald-600 bg-emerald-50/50 px-2 py-1 rounded -mx-2">
                      <span>Discount</span>
                      <span>-{formatPrice(order.discountApplied || order.discount)}</span>
                    </div>
                  )}
                  {/* Tax and Shipping removed as requested */}
                  
                  <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                    <span>Total Amount</span>
                    <span>{formatPrice(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Email Actions (Hidden in Print) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Mail size={20} className="text-slate-400" /> Email Notifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <EmailButton 
                  label="Order Confirmation" 
                  onClick={() => requestAction('email', 'confirmation')} 
                />
                <EmailButton 
                  label="Shipping Update" 
                  onClick={() => requestAction('email', 'shipped')} 
                />
                <EmailButton 
                  label="Delivery Update" 
                  onClick={() => requestAction('email', 'delivered')} 
                />
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (Sidebar Info) --- */}
          <div className="space-y-6 print:mt-6 print:grid print:grid-cols-2 print:gap-6 print:space-y-0">
            
            {/* Customer Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border">
              <h3 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-50 flex items-center justify-between">
                <span>Customer</span>
                <User size={18} className="text-slate-300" />
              </h3>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                   <User size={18} />
                 </div>
                 <div className="overflow-hidden">
                   <p className="font-medium text-slate-900 truncate">{order.shippingAddress?.name || order.user?.name || 'Guest User'}</p>
                   <p className="text-rose-600 text-sm hover:underline cursor-pointer truncate">{order.customerEmail}</p>
                   <p className="text-slate-500 text-sm mt-1">{order.customerPhone || 'No Phone Provided'}</p>
                 </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border">
               <h3 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-50 flex items-center justify-between">
                 <span>Shipping Address</span>
                 <Truck size={18} className="text-slate-300" />
               </h3>
               <div className="text-sm text-slate-600 space-y-1.5 leading-relaxed">
                 <p className="font-medium text-slate-900">{order.shippingAddress?.name}</p>
                 <p>{order.shippingAddress?.address}</p>
                 <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                 <p className="font-mono text-slate-500">{order.shippingAddress?.pincode}</p>
                 <p className="text-xs text-slate-400 mt-2 uppercase tracking-wide font-bold">India</p>
               </div>
               
               {/* Map Link */}
               <a 
                 href={getMapUrl()}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-4 hover:underline print:hidden"
               >
                 <MapPin size={14} /> Open in Maps
               </a>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border print:col-span-2">
               <h3 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-50 flex items-center justify-between">
                 <span>Payment Details</span>
                 <ShieldCheck size={18} className="text-slate-300" />
               </h3>
               <div className="space-y-4">
                 <div className="flex justify-between text-sm items-center">
                   <span className="text-slate-500">Method</span>
                   <div className="flex items-center gap-2">
                     <CreditCard size={14} className="text-slate-400" />
                     <span className="font-medium text-slate-900 uppercase">{order.paymentMethod}</span>
                   </div>
                 </div>
                 <div className="flex justify-between text-sm items-center">
                   <span className="text-slate-500">Status</span>
                   <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ring-1 ring-inset ${
                     order.paymentStatus === 'paid' 
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' 
                      : order.paymentStatus === 'failed' 
                        ? 'bg-red-50 text-red-700 ring-red-200' 
                        : 'bg-amber-50 text-amber-700 ring-amber-200'
                   }`}>
                     {order.paymentStatus}
                   </span>
                 </div>
                 {order.paymentDetails?.transactionId && (
                   <div className="pt-3 border-t border-slate-50">
                     <p className="text-xs text-slate-400 mb-1.5">Transaction ID</p>
                     <p className="text-xs font-mono bg-slate-50 px-2 py-1.5 rounded text-slate-600 break-all border border-slate-200 select-all">
                       {order.paymentDetails.transactionId}
                     </p>
                   </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- Universal Confirmation Modal --- */}
      <AnimatePresence>
        {confirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:hidden">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`p-3 rounded-full ${confirmation.type === 'status' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    {confirmation.type === 'status' ? <AlertTriangle size={24} /> : <Mail size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {confirmation.type === 'status' ? 'Update Status?' : 'Resend Email?'}
                    </h3>
                  </div>
                </div>
                
                <div className="text-slate-600 text-sm mb-6 leading-relaxed">
                  {confirmation.type === 'status' ? (
                    <>
                      Are you sure you want to change this order status from <span className="font-semibold text-slate-900 uppercase">{order.status}</span> to <span className="font-bold text-rose-600 uppercase">{confirmation.data}</span>? This will notify the customer.
                    </>
                  ) : (
                    <>
                      Are you sure you want to resend the <span className="font-semibold text-slate-900 capitalize">{confirmation.data}</span> email to <span className="font-medium text-slate-900">{order.customerEmail}</span>?
                    </>
                  )}
                </div>

                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                    disabled={confirmation.isLoading}
                    className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeAction}
                    disabled={confirmation.isLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {confirmation.isLoading && <Loader2 size={16} className="animate-spin" />}
                    {confirmation.type === 'status' ? 'Confirm Update' : 'Send Email'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// --- Sub Components ---

const StatusBadge = ({ status, size = 'normal' }) => {
  const styles = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
    shipped: "bg-purple-100 text-purple-800 border-purple-200",
    delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cancelled: "bg-red-50 text-red-800 border-red-100",
  };
  
  const statusKey = status?.toLowerCase() || 'pending';
  const sizeClasses = size === 'large' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border capitalize shadow-sm ${styles[statusKey]} ${sizeClasses}`}>
      {statusKey === 'delivered' && <CheckCircle size={size === 'large' ? 14 : 12} />}
      {status}
    </span>
  );
};

const EmailButton = ({ label, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-white hover:border-slate-300 hover:text-slate-900 hover:shadow-sm transition-all active:scale-[0.98]"
  >
    <Mail size={16} />
    {label}
  </button>
);

export default AdminOrderDetails;