import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { cartApi } from '../services/cart'
import { orderApi } from '../services/orders'
import { paymentApi } from '../services/payments'
import { AuthContext } from '../context/AuthContext'
import './pages.css'

const Checkout = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(null)
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
  }

  const handleSelectAddress = (address) => {
    setSelectedAddress(address)
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
    // Validate form
    if (!shippingAddress.name || !shippingAddress.phone || !shippingAddress.address ||
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      alert('Please fill in all shipping address fields')
      return
    }

    setPlacingOrder(true)

    try {
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
          amount: cart.totalAmount,
          currency: 'INR'
        })

        // Initiate Razorpay payment
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: razorpayOrder.order.amount,
          currency: razorpayOrder.order.currency,
          name: import.meta.env.VITE_APP_NAME,
          description: 'Saree Purchase',
          order_id: razorpayOrder.order.id,
          handler: async function (response) {
            try {
              // First create the order
              const order = await orderApi.createOrder(orderData)

              // Then verify payment
              await paymentApi.verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order.order._id
              })

              navigate(`/orders/${order.order._id}`, {
                state: { success: true, message: 'Order placed successfully!' }
              })
            } catch (error) {
              console.error('Payment verification failed:', error)
              alert('Payment verification failed')
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
            contact: shippingAddress.phone
          },
          theme: {
            color: '#e91e63'
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
        rzp.on('payment.failed', async function (response) {
          alert('Payment failed. Please try again.')
          setPlacingOrder(false)
        })
      } else {
        // COD Order
        const order = await orderApi.createOrder(orderData)
        navigate(`/orders/${order.order._id}`, {
          state: { success: true, message: 'Order placed successfully!' }
        })
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      if (paymentMethod === 'cod') {
        setPlacingOrder(false)
      }
    }
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    )
  }

  const shipping = cart.totalAmount >= 999 ? 0 : 50
  const tax = Math.round(cart.totalAmount * 0.18 * 100) / 100
  const total = cart.totalAmount + shipping + tax

  return (
    <div className="checkout-page">
      <div className="page-header">
        <h1>Checkout</h1>
      </div>

      <div className="checkout-layout">
        {/* Checkout Form */}
        <div className="checkout-form">
          {/* Shipping Address */}
          <div className="checkout-section">
            <h2>Shipping Address</h2>

            {user.addresses && user.addresses.length > 0 && (
              <div className="saved-addresses">
                <h3>Saved Addresses</h3>
                {user.addresses.map((address, index) => (
                  <div
                    key={index}
                    className={`address-card ${selectedAddress === address ? 'selected' : ''}`}
                    onClick={() => handleSelectAddress(address)}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress === address}
                      onChange={() => handleSelectAddress(address)}
                    />
                    <div className="address-details">
                      <p><strong>{address.name}</strong></p>
                      <p>{address.phone}</p>
                      <p>{address.address}</p>
                      <p>{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="address-form">
              <h3>{user.addresses?.length ? 'Or enter new address' : 'Enter shipping address'}</h3>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={shippingAddress.name}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address *</label>
                <textarea
                  name="address"
                  value={shippingAddress.address}
                  onChange={handleAddressChange}
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={shippingAddress.pincode}
                  onChange={handleAddressChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="checkout-section">
            <h2>Payment Method</h2>
            <div className="payment-methods">
              <label className={`payment-method ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-info">
                  <span className="payment-name">Cash on Delivery</span>
                  <span className="payment-desc">Pay when you receive your order</span>
                </div>
              </label>
              <label className={`payment-method ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <div className="payment-info">
                  <span className="payment-name">Online Payment</span>
                  <span className="payment-desc">Pay securely with Razorpay</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {cart.items.map(item => (
              <div key={item._id} className="summary-item">
                <div className="item-info">
                  <p className="item-name">{item.product?.name}</p>
                  <p className="item-variant">
                    {item.selectedSize && `Size: ${item.selectedSize}`}
                    {item.selectedColor && ` | Color: ${item.selectedColor}`}
                  </p>
                </div>
                <div className="item-qty-price">
                  <span>Qty: {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <hr />
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(cart.totalAmount)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (18% GST)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <hr />
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder}
            className="btn btn-primary btn-lg btn-block"
          >
            {placingOrder ? 'Processing...' : 'Place Order'}
          </button>
          <p className="terms">
            By placing order, you agree to our Terms & Conditions
          </p>
        </div>
      </div>
    </div>
  )
}

export default Checkout
