import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MapPin, CreditCard, Banknote, ShieldCheck, Lock, 
  ChevronRight, Truck, AlertCircle, Loader2, Home 
} from 'lucide-react'
import { cartApi } from '../services/cart'
import { orderApi } from '../services/orders'
import { paymentApi } from '../services/payments'
import { AuthContext } from '../context/AuthContext'

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')

  // Form state
  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
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
      } finally {
        setLoading(false)
      }
    }

    fetchCart()
  }, [user, navigate])

  const handleAddressChange = (e) => {
    setShippingAddress({
      ...shippingAddress,
      [e.target.name]: e.target.value
    })
    // Deselect saved address if user starts typing manually
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

  const handlePlaceOrder = async () => {
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      alert('Please fill in all shipping address fields')
      return
    }

    setPlacingOrder(true)

    try {
      // Calculate totals locally for safety check (optional)
      const shipping = cart.totalAmount >= 999 ? 0 : 50
      const tax = Math.round(cart.totalAmount * 0.18 * 100) / 100
      const totalAmount = cart.totalAmount + shipping + tax

      const orderData = {
        items: cart.items.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor
        })),
        shippingAddress,
        paymentMethod
      }

      if (paymentMethod === 'razorpay') {
        // Create Razorpay order
        const razorpayOrder = await paymentApi.createRazorpayOrder({
          amount: totalAmount, // Ensure backend validates this match
          currency: 'INR'
        })

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: razorpayOrder.order.amount,
          currency: razorpayOrder.order.currency,
          name: "Luxe Sarees", // App Name
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
              alert('Payment verification failed')
            }
          },
          prefill: {
            name: shippingAddress.name,
            email: user.email,
            contact: shippingAddress.phone
          },
          theme: { color: '#e11d48' } // Rose-600
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
        rzp.on('payment.failed', function () {
            alert('Payment failed. Please try again.')
            setPlacingOrder(false)
        })
      } else {
        // COD Order
        const order = await orderApi.createOrder(orderData)
        navigate(`/orders/${order.order._id}`, { state: { success: true } })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
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

  // Calculations
  const shippingCost = cart.totalAmount >= 999 ? 0 : 50
  const tax = Math.round(cart.totalAmount * 0.18 * 100) / 100
  const total = cart.totalAmount + shippingCost + tax

  return (
    <div className="min-h-screen bg-stone-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Simple Header */}
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
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Saved Addresses</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.addresses.map((addr, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectAddress(addr, index)}
                        className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 relative ${
                          selectedAddressIndex === index 
                            ? 'border-rose-500 bg-rose-50/30' 
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
                          <div className="absolute top-4 right-4 text-rose-500">
                            <ShieldCheck size={20} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">Or enter new details</span>
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
                    rows="3"
                    value={shippingAddress.address}
                    onChange={handleAddressChange}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
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
                    <p className="text-xs text-slate-500">Credit/Debit Card, UPI, NetBanking</p>
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
                    <p className="text-xs text-slate-500">Pay physically upon receipt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary (Sticky) */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-8 space-y-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                <h3 className="text-lg font-serif text-slate-900 mb-4 border-b border-slate-100 pb-3">Order Summary</h3>
                
                {/* Product Mini List */}
                <div className="max-h-60 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
                  {cart.items.map(item => (
                    <div key={item._id} className="flex gap-3">
                      <div className="w-16 h-20 rounded bg-slate-100 overflow-hidden shrink-0">
                         {item.product?.images?.[0] && <img src={item.product.images[0].url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.product?.name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.selectedSize} | {item.selectedColor}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                          <p className="text-sm font-medium text-slate-900">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span className="flex items-center gap-1">Shipping <Truck size={14}/></span>
                    <span className={shippingCost === 0 ? 'text-emerald-600 font-medium' : ''}>
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>GST (18%)</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="font-semibold text-slate-900">Total to Pay</span>
                    <span className="text-xl font-bold text-rose-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  className="w-full mt-6 bg-slate-900 text-white py-4 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" /> Processing
                    </>
                  ) : (
                    <>
                      Place Order <ChevronRight size={18} />
                    </>
                  )}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Lock size={12} /> SSL Encrypted & Secure
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// Reusable Input Component for cleaner JSX
const InputGroup = ({ label, ...props }) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
    <input
      {...props}
      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
    />
  </div>
)

export default Checkout