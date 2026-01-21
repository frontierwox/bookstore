import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Mail, Truck, MapPin, 
  User, CreditCard, Calendar, ChevronDown, CheckCircle, 
  AlertTriangle, Loader2, Package, ShieldCheck, Ticket, FileText, 
  Copy, ExternalLink
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

  // Modal State
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    type: null, // 'status' | 'email'
    data: null, 
    isLoading: false
  });

  // --- Effects ---
  useEffect(() => {
    fetchOrder();
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

  const requestAction = (type, data) => {
    setIsDropdownOpen(false);
    if (type === 'status' && order.status === data) return;
    setConfirmation({
      isOpen: true,
      type,
      data,
      isLoading: false
    });
  };

  const executeAction = async () => {
    setConfirmation(prev => ({ ...prev, isLoading: true }));
    const { type, data } = confirmation;

    try {
      if (type === 'status') {
        await adminApi.updateOrderStatus(id, { status: data });
        await fetchOrder();
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const getMapUrl = () => {
    if (!order?.shippingAddress) return '#';
    const query = `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.pincode}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // --- Render: Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
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
                              : 'text-slate-700 hover:bg-slate-50 hover:text-indigo-600'}
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
              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="p-4 flex gap-4 hover:bg-slate-50/30 transition-colors">
                    <div className="w-16 h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                      <img 
                        src={item.image || item.product?.images?.[0]?.url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {item.selectedSize} | Color: {item.selectedColor}
                      </p>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          x{item.quantity}
                        </span>
                        <span className="font-medium text-slate-900 text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ DETAILED TRANSACTION BOX */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600"/> Payment Transaction Log
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  order.paymentStatus === 'completed' || order.paymentStatus === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {order.paymentStatus}
                </span>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
                
                {/* Payer Info */}
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Payer Details</p>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{order.user?.name || order.shippingAddress?.name}</p>
                    <p className="text-slate-500 flex items-center gap-2">
                      <Mail size={12} /> {order.customerEmail}
                    </p>
                    <p className="text-slate-500 flex items-center gap-2">
                      <User size={12} /> {order.customerPhone}
                    </p>
                  </div>
                </div>

                {/* Method Info */}
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Payment Method</p>
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard size={16} className="text-slate-700"/>
                    <span className="font-bold text-slate-900">Online (Razorpay)</span>
                  </div>
                  <p className="text-slate-500">Amount: <span className="font-mono text-slate-900 font-medium">{formatPrice(order.totalAmount)}</span></p>
                </div>

                {/* Gateway Details Row */}
                <div className="md:col-span-2 border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Gateway Order ID */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 group relative">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gateway Order ID</p>
                    <div className="flex justify-between items-center">
                      <p className="font-mono text-slate-700 text-xs truncate pr-2">
                        {order.paymentDetails?.razorpayOrderId || 'N/A'}
                      </p>
                      {order.paymentDetails?.razorpayOrderId && (
                        <button onClick={() => copyToClipboard(order.paymentDetails.razorpayOrderId)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Gateway Payment ID */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 group relative">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Gateway Payment ID</p>
                    <div className="flex justify-between items-center">
                      <p className="font-mono text-slate-700 text-xs truncate pr-2">
                        {order.paymentDetails?.razorpayPaymentId || 'N/A'}
                      </p>
                      {order.paymentDetails?.razorpayPaymentId && (
                        <button onClick={() => copyToClipboard(order.paymentDetails.razorpayPaymentId)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Signature Hash */}
                  {order.paymentDetails?.razorpaySignature && (
                    <div className="md:col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Signature Hash (Verification)</p>
                      <p className="font-mono text-[10px] text-slate-500 break-all select-all">
                        {order.paymentDetails.razorpaySignature}
                      </p>
                    </div>
                  )}

                  {/* Internal ID */}
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Internal Order ID</p>
                    <p className="font-mono text-xs text-slate-500">{order._id}</p>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (Sidebar Info) --- */}
          <div className="space-y-6 print:mt-6 print:grid print:grid-cols-2 print:gap-6 print:space-y-0">
            
            {/* Customer Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:shadow-none print:border">
              <h3 className="font-semibold text-slate-900 mb-4 pb-3 border-b border-slate-50 flex items-center justify-between">
                <span>Customer</span>
                <User size={18} className="text-slate-300" />
              </h3>
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-sm border border-indigo-100">
                   {(order.shippingAddress.name || 'U').charAt(0)}
                 </div>
                 <div className="overflow-hidden">
                   <p className="font-medium text-slate-900 truncate">{order.shippingAddress?.name}</p>
                   <a href={`mailto:${order.customerEmail}`} className="text-indigo-600 text-sm hover:underline cursor-pointer truncate block mt-0.5">
                     {order.customerEmail}
                   </a>
                   <a href={`tel:${order.customerPhone}`} className="text-slate-500 text-sm mt-0.5 hover:text-slate-800 block">
                     {order.customerPhone}
                   </a>
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
               
               <a 
                 href={getMapUrl()}
                 target="_blank"
                 rel="noreferrer"
                 className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-semibold mt-4 hover:underline print:hidden bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-indigo-100"
               >
                 <MapPin size={14} /> View on Map <ExternalLink size={10} />
               </a>
            </div>

            {/* Email Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 print:hidden">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Mail size={18} className="text-slate-400" /> Notifications
              </h3>
              <div className="flex flex-col gap-2">
                <EmailButton label="Resend Confirmation" onClick={() => requestAction('email', 'confirmation')} />
                <EmailButton label="Resend Shipping Alert" onClick={() => requestAction('email', 'shipped')} />
                <EmailButton label="Resend Delivery Alert" onClick={() => requestAction('email', 'delivered')} />
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
                      Are you sure you want to change this order status from <span className="font-semibold text-slate-900 uppercase">{order.status}</span> to <span className="font-bold text-indigo-600 uppercase">{confirmation.data}</span>?
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
                    {confirmation.type === 'status' ? 'Confirm' : 'Send'}
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
    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-white hover:border-indigo-200 hover:text-indigo-600 transition-all active:scale-[0.98] group"
  >
    {label}
    <Mail size={14} className="text-slate-400 group-hover:text-indigo-500" />
  </button>
);

export default AdminOrderDetails;