import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, CreditCard, Banknote, ShieldCheck, Lock, 
  ChevronRight, Truck, AlertCircle, Loader2, Home, Ticket, X 
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cartApi } from '../services/cart'
import { orderApi } from '../services/orders'
import { paymentApi } from '../services/payments'
import { AuthContext } from '../context/AuthContext'

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useContext(AuthContext)
  
  // --- Core State ---
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  
  // --- Checkout State ---
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  // --- Coupon State (Receive from Cart via navigation state) ---
  const [appliedCoupon, setAppliedCoupon] = useState(null)

  // --- Initial Load ---
  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Check if coupon was passed from Cart page
    if (location.state?.appliedCoupon) {
      setAppliedCoupon(location.state.appliedCoupon)
    }

    const fetchCart = async () => {
      try {
        const data = await cartApi.getCart()
        if (!data.cart || data.cart.items.length === 0) {
          navigate('/cart')
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
  }, [user, navigate, location])

  // --- Handlers: Address ---
  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    })
    if (selectedAddressIndex !== null) setSelectedAddressIndex(null)
  }

  const handleSelectAddress = (address, index) => {
    setSelectedAddressIndex(index)
    setShippingAddress({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    })
  }

  // --- Handlers: Coupon ---
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    toast.success("Coupon removed")
  }

  // --- Handlers: Order Placement ---
  const handlePlaceOrder = async () => {
    // 1. Validation
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      toast.error('Please fill in all shipping address fields')
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
        paymentMethod,
        couponCode: appliedCoupon?.code || null // Send coupon code if applied
      }

      // 3. Handle Payment Flow
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order with FINAL calculated amount
        const razorpayOrder = await paymentApi.createRazorpayOrder({
          amount: finalTotal, 
          currency: 'INR'
        })

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: razorpayOrder.order.amount,
          currency: razorpayOrder.order.currency,
          name: "Luxe Sarees",
          description: 'Authentic Saree Purchase',
          order_id: razorpayOrder.order.id,
          handler: async function (response) {
            try {
              const order = await orderApi.createOrder(orderData)
              await paymentApi.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order.order._id
              })
              navigate(`/orders/${order.order._id}`, { state: { success: true } })
            } catch (error) {
              console.error('Payment verification failed:', error)
              toast.error('Payment verification failed')
            }
          },
          prefill: {
            name: shippingAddress.name,
            email: user.email,
            contact: shippingAddress.phone
          },
          theme: { color: '#e11d48' }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
        rzp.on('payment.failed', function () {
            toast.error('Payment failed. Please try again.')
            setPlacingOrder(false)
        })
      } else {
        // COD Order
        const order = await orderApi.createOrder(orderData)
        navigate(`/orders/${order.order._id}`, { state: { success: true } })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      toast.error(error.response?.data?.message || 'Failed to place order')
      setPlacingOrder(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Preparing secure checkout...</p>
      </div>
    )
  }

  // --- Financial Calculations (Must match Backend Logic) ---
  const subtotal = cart.totalAmount
  const discount = appliedCoupon ? appliedCoupon.discountAmount : 0
  
  // Tax is calculated on discounted amount
  const taxableAmount = Math.max(0, subtotal - discount)
  const tax = Math.round(taxableAmount * 0.18 * 100) / 100
  
  // Shipping is based on subtotal (Pre-discount usually, matching backend logic)
  const shippingCost = subtotal >= 999 ? 0 : 50
  
  const finalTotal = Math.round(subtotal - discount + shippingCost + tax)

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-center mb-8 relative">
          <h1 className="text-2xl md:text-3xl font-serif text-slate-900 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-600" /> Secure Checkout
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Forms */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* 1. Delivery Address Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <MapPin size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Delivery Address</h2>
              </div>

              {/* Saved Addresses Grid */}
              {user.addresses && user.addresses.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Saved Addresses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.addresses.map((addr, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectAddress(addr, index)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative ${
                          selectedAddressIndex === index 
                            ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' 
                            : 'border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Home size={18} className="text-slate-400 mt-1" />
                          <div className="text-sm text-slate-600 space-y-1">
                            <p className="font-semibold text-slate-900">{addr.name}</p>
                            <p>{addr.address}</p>
                            <p>{addr.city}, {addr.pincode}</p>
                            <p className="text-xs text-slate-400 mt-2">{addr.phone}</p>
                          </div>
                        </div>
                        {selectedAddressIndex === index && (
                          <div className="absolute top-4 right-4 text-rose-600">
                            <ShieldCheck size={20} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-medium">Or enter new details</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>
                </div>
              )}

              {/* Address Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup label="Full Name" name="name" value={shippingAddress.name} onChange={handleAddressChange} />
                  <InputGroup label="Phone Number" name="phone" type="tel" value={shippingAddress.phone} onChange={handleAddressChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 uppercase">Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    value={shippingAddress.address}
                    onChange={handleAddressChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
                    placeholder="Street address, Apartment, Suite..."
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InputGroup label="City" name="city" value={shippingAddress.city} onChange={handleAddressChange} />
                  <InputGroup label="State" name="state" value={shippingAddress.state} onChange={handleAddressChange} />
                  <InputGroup label="Pincode" name="pincode" value={shippingAddress.pincode} onChange={handleAddressChange} />
                </div>
              </div>
            </div>

            {/* 2. Payment Method Section */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Razorpay Option */}
                <div 
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === 'razorpay' ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'razorpay' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Online Payment</p>
                    <p className="text-xs text-slate-500">Credit/Debit Card, UPI</p>
                  </div>
                </div>

                {/* COD Option */}
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === 'cod' ? 'border-rose-500 bg-rose-50/30 ring-1 ring-rose-500' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Banknote size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Cash on Delivery</p>
                    <p className="text-xs text-slate-500">Pay upon receipt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary (Sticky) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-8 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
                <h3 className="text-lg font-serif text-slate-900 mb-4 border-b border-slate-100 pb-3">Order Summary</h3>
                
                {/* Product Mini List */}
                <div className="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
                  {cart.items.map(item => (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-16 h-20 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          {item.product?.images?.[0] && <img src={item.product.images[0].url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.product?.name}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{item.selectedSize} | {item.selectedColor}</p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- COUPON DISPLAY (READ-ONLY) --- */}
                {appliedCoupon && (
                  <div className="mb-6 pt-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                          <Ticket size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-emerald-700 truncate">{appliedCoupon.code} Applied</p>
                          <p className="text-[10px] text-emerald-600">You saved {formatPrice(appliedCoupon.discountAmount)}</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleRemoveCoupon}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        aria-label="Remove coupon"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">{formatPrice(subtotal)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-medium">
                      <span>Coupon Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-1">Shipping <Truck size={14} className="text-slate-400"/></span>
                    <span className={shippingCost === 0 ? 'text-emerald-600 font-medium' : ''}>
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>GST (18%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                    <span className="font-bold text-slate-900 text-lg">Total Amount</span>
                    <span className="text-xl font-bold text-rose-600">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full mt-6 bg-rose-600 text-white py-4 rounded-xl font-medium shadow-lg shadow-rose-600/20 hover:shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> Processing...
                    </>
                  ) : (
                    <>
                      Place Order <ChevronRight size={18} />
                    </>
                  )}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Lock size={12} /> SSL Encrypted & Secure Payment
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Reusable Input Component
const InputGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
    <input
      {...props}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
    />
  </div>
)

export default Checkout