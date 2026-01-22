import { useState, useEffect, useContext, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  MapPin, CreditCard, ShieldCheck, Lock, 
  ChevronRight, Loader2, Building2, AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cartApi } from '../services/cart'
import { orderApi } from '../services/orders'
import { paymentApi } from '../services/payments'
import { AuthContext } from '../context/AuthContext'

// --- Razorpay SDK Loader (Unchanged) ---
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useContext(AuthContext)
  
  const isReseller = user?.role === 'reseller'
  
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  
  // ✅ Form State
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  // ✅ Error State for Validation
  const [errors, setErrors] = useState({})

  const [appliedCoupon, setAppliedCoupon] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    if (location.state?.appliedCoupon && !isReseller) {
      setAppliedCoupon(location.state.appliedCoupon)
    }

    const fetchCart = async () => {
      try {
        const data = await cartApi.getCart()
        if (!data.cart || data.cart.items.length === 0) {
          navigate(isReseller ? '/reseller/catalog' : '/cart')
          return
        }
        setCart(data.cart)
      } catch (error) {
        console.error('Error fetching cart:', error)
        toast.error("Failed to load cart")
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [user, navigate, location, isReseller])

  const { subtotal, totalShipping, totalTax, totalAmount } = useMemo(() => {
    if (!cart) return { subtotal: 0, totalShipping: 0, totalTax: 0, totalAmount: 0 }
    return {
      subtotal: Number(cart.subtotal) || 0,
      totalShipping: Number(cart.totalShipping) || 0,
      totalTax: Number(cart.totalTax) || 0,
      totalAmount: Number(cart.totalAmount) || 0
    }
  }, [cart])

  const discountAmount = !isReseller && appliedCoupon ? appliedCoupon.discountAmount : 0
  const finalTotal = Math.max(0, totalAmount - discountAmount)

  // ✅ Improved Handle Change (Clears error on type)
  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setShippingAddress(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear specific error if user types something
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // ✅ Validation Function
  const validateForm = () => {
    const newErrors = {}
    
    if (!shippingAddress.name.trim()) newErrors.name = "Full Name is required"
    if (!shippingAddress.phone.trim()) newErrors.phone = "Phone Number is required"
    else if (shippingAddress.phone.length < 10) newErrors.phone = "Enter a valid phone number"
    
    if (!shippingAddress.address.trim()) newErrors.address = "Street Address is required"
    if (!shippingAddress.city.trim()) newErrors.city = "City is required"
    if (!shippingAddress.state.trim()) newErrors.state = "State is required"
    if (!shippingAddress.pincode.trim()) newErrors.pincode = "Pincode is required"
    else if (shippingAddress.pincode.length < 6) newErrors.pincode = "Invalid Pincode"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePlaceOrder = async () => {
    // 1. Run Validation First
    if (!validateForm()) {
      toast.error('Please fill in all required delivery details', {
        icon: '📝',
        duration: 3000
      })
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setPlacingOrder(true)

    try {
      // 2. Prepare Order Data
      const orderData = {
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor
        })),
        shippingAddress,
        paymentMethod: 'razorpay', 
        couponCode: appliedCoupon?.code || null
      }

      // 3. Create Order in DB
      const orderResponse = await orderApi.createOrder(orderData)
      const newOrder = orderResponse.order;

      // 4. Initiate Razorpay Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Payment gateway failed to load. Check connection.');
        setPlacingOrder(false);
        return;
      }

      const rpOrderData = await paymentApi.createRazorpayOrder({ 
        orderId: newOrder._id 
      });

      const options = {
        key: rpOrderData.key,
        amount: rpOrderData.amount,
        currency: rpOrderData.currency,
        name: isReseller ? "Wholesale Portal" : "Shri Sai Collections",
        description: `Order #${newOrder.orderNumber}`,
        order_id: rpOrderData.id,
        prefill: {
          name: shippingAddress.name,
          email: user.email,
          contact: shippingAddress.phone
        },
        theme: { color: isReseller ? '#4f46e5' : '#e11d48' },
        handler: async function (response) {
          const loadingToast = toast.loading('Verifying secure payment...');
          try {
            await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: newOrder._id
            });
            
            toast.dismiss(loadingToast);
            toast.success('Payment Successful!');
            navigate(`/orders/${newOrder._id}`, { state: { success: true } });
          } catch (err) {
            toast.dismiss(loadingToast);
            console.error("Verification Error:", err);
            toast.error('Payment verification failed. Support has been notified.');
            navigate(`/orders/${newOrder._id}`);
          }
        },
        modal: {
          ondismiss: function() {
            toast('Payment cancelled', { icon: '⚠️' });
            setPlacingOrder(false);
            navigate(`/orders/${newOrder._id}`);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error.response?.data?.message || 'Failed to initialize order')
      setPlacingOrder(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  // Helper to render input fields with error styles
  const renderInput = (name, placeholder, label, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700 ml-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <input 
        type={type}
        name={name} 
        placeholder={placeholder} 
        value={shippingAddress[name]} 
        onChange={handleAddressChange} 
        className={`p-3 border rounded-lg w-full outline-none transition-all duration-200
          ${errors[name] 
            ? 'border-red-500 bg-red-50 focus:border-red-500' 
            : `border-slate-200 focus:border-${isReseller ? 'indigo' : 'rose'}-500 bg-white`
          }`}
      />
      {errors[name] && (
        <span className="text-xs text-red-500 flex items-center gap-1 ml-1">
          <AlertCircle size={10} /> {errors[name]}
        </span>
      )}
    </div>
  )

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><Loader2 className="w-10 h-10 animate-spin text-rose-600"/></div>

  return (
    <div className={`min-h-screen py-8 px-4 md:px-8 font-sans ${isReseller ? 'bg-slate-50' : 'bg-stone-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center mb-8 relative">
          <h1 className="text-2xl md:text-3xl font-serif text-slate-900 flex items-center gap-2">
            <Lock className={`w-6 h-6 ${isReseller ? 'text-indigo-600' : 'text-emerald-600'}`} /> 
            {isReseller ? 'Wholesale Checkout' : 'Secure Checkout'}
          </h1>
          {isReseller && (
            <span className="absolute top-0 right-0 hidden md:flex items-center gap-1 text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded border border-indigo-200 uppercase font-bold tracking-wide">
              <Building2 size={12}/> B2B Portal
            </span>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3 space-y-6">
            <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-sm border ${isReseller ? 'border-slate-200' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReseller ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}><MapPin size={20} /></div>
                <h2 className="text-xl font-semibold text-slate-900">Delivery Address</h2>
              </div>
            
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderInput('name', 'John Doe', 'Full Name')}
                  {renderInput('phone', '9876543210', 'Phone Number', 'number')}
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700 ml-1">Address <span className="text-red-500">*</span></label>
                  <textarea 
                    name="address" 
                    placeholder="Street, House No, Area" 
                    value={shippingAddress.address} 
                    onChange={handleAddressChange} 
                    rows={3}
                    className={`p-3 border rounded-lg w-full outline-none transition-all duration-200 resize-none
                      ${errors.address 
                        ? 'border-red-500 bg-red-50 focus:border-red-500' 
                        : `border-slate-200 focus:border-${isReseller ? 'indigo' : 'rose'}-500 bg-white`
                      }`}
                  />
                  {errors.address && <span className="text-xs text-red-500 flex items-center gap-1 ml-1"><AlertCircle size={10} /> {errors.address}</span>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {renderInput('city', 'Mumbai', 'City')}
                  {renderInput('state', 'Maharashtra', 'State')}
                  {renderInput('pincode', '400001', 'Pincode', 'number')}
                </div>
              </div>
            </div>

            {/* Payment Section - Unchanged Logic */}
            <div className={`bg-white p-6 md:p-8 rounded-2xl shadow-sm border ${isReseller ? 'border-slate-200' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReseller ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}><CreditCard size={20} /></div>
                <h2 className="text-xl font-semibold text-slate-900">Secure Payment</h2>
              </div>
              
              <div className={`p-4 rounded-xl border-2 flex items-center gap-4 ${isReseller ? 'border-indigo-500 bg-indigo-50/10' : 'border-rose-500 bg-rose-50/10'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm`}>
                  <CreditCard size={24} className={isReseller ? 'text-indigo-600' : 'text-rose-600'}/>
                </div>
                <div>
                  <p className="font-bold text-slate-900">Online Payment</p>
                  <p className="text-xs text-slate-500">UPI, Cards, Netbanking (Razorpay)</p>
                </div>
                <div className="ml-auto">
                  <ShieldCheck size={20} className={isReseller ? 'text-indigo-500' : 'text-rose-500'} />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3">
            <div className="sticky top-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
              <h3 className="text-lg font-serif font-bold mb-4">{isReseller ? 'Wholesale Summary' : 'Order Summary'}</h3>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                {discountAmount > 0 && !isReseller && <div className="flex justify-between text-sm text-emerald-600"><span>Coupon Discount</span><span>-{formatPrice(discountAmount)}</span></div>}
                <div className="flex justify-between text-sm"><span>Shipping</span><span>{totalShipping === 0 ? 'Free' : formatPrice(totalShipping)}</span></div>
                <div className="flex justify-between text-sm"><span>{isReseller ? 'GST' : 'Tax'}</span><span>{formatPrice(totalTax)}</span></div>
                <div className="flex justify-between items-center pt-4 border-t mt-2"><span className="font-bold text-lg">Total</span><span className={`text-xl font-bold ${isReseller ? 'text-indigo-600' : 'text-rose-600'}`}>{formatPrice(finalTotal)}</span></div>
              </div>

              <button onClick={handlePlaceOrder} disabled={placingOrder} className={`w-full mt-6 text-white py-4 rounded-xl font-medium shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isReseller ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {placingOrder ? <Loader2 className="animate-spin w-5 h-5" /> : <>Pay Securely <ChevronRight size={18} /></>}
              </button>
              
              <div className="mt-4 flex flex-col items-center gap-1 text-xs text-slate-400">
                <div className="flex items-center gap-1"><Lock size={12} /> SSL Encrypted & Secure Payment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout