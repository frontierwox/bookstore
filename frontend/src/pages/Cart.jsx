import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MdTrash2, MdAdd, MdRemove } from 'react-icons/md'
import { cartApi } from '../services/cart'
import { AuthContext } from '../context/AuthContext'
import CartSummary from '../components/CartSummary'
import './pages.css'

const Cart = () => {
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user])

  const fetchCart = async () => {
    try {
      const data = await cartApi.getCart()
      setCart(data.cart)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    try {
      await cartApi.updateCartItem(itemId, { quantity: newQuantity })
      fetchCart()
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const handleRemoveItem = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      try {
        await cartApi.removeFromCart(itemId)
        fetchCart()
      } catch (error) {
        console.error('Error removing item:', error)
      }
    }
  }

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await cartApi.clearCart()
        fetchCart()
      } catch (error) {
        console.error('Error clearing cart:', error)
      }
    }
  }

  const handleCheckout = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/checkout')
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading cart...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="access-denied">
        <h2>Please Login</h2>
        <p>You need to login to view your cart</p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart-page">
        <h2>Your Cart is Empty</h2>
        <p>Add some beautiful sarees to your cart</p>
        <Link to="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <p>{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</p>
      </div>

      <div className="cart-layout">
        {/* Cart Items */}
        <div className="cart-items">
          <div className="cart-items-header">
            <h3>Items</h3>
            <button onClick={handleClearCart} className="btn btn-text">
              Clear Cart
            </button>
          </div>

          {cart.items.map(item => (
            <div key={item._id} className="cart-item">
              {/* Product Image */}
              <div className="cart-item-image">
                {item.product?.images?.[0] && (
                  <img src={item.product.images[0].url} alt={item.product.name} />
                )}
              </div>

              {/* Product Info */}
              <div className="cart-item-info">
                <Link to={`/products/${item.product?._id}`} className="item-name">
                  {item.product?.name}
                </Link>
                <div className="item-variant">
                  {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                  {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                </div>
                <div className="item-price">{formatPrice(item.price)}</div>
              </div>

              {/* Quantity Controls */}
              <div className="cart-item-quantity">
                <button
                  onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <MdRemove size={18} />
                </button>
                <span>{item.quantity}</span>
                <button onClick={() => handleQuantityChange(item._id, item.quantity + 1)}>
                  <MdAdd size={18} />
                </button>
              </div>

              {/* Item Total */}
              <div className="cart-item-total">
                {formatPrice(item.price * item.quantity)}
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveItem(item._id)}
                className="btn btn-icon btn-danger"
              >
                <MdTrash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="cart-summary-section">
          <CartSummary cart={cart} onCheckout={handleCheckout} />
        </div>
      </div>
    </div>
  )
}

export default Cart
