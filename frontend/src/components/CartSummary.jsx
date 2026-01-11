import { Link } from 'react-router-dom'
import { MdShoppingCart } from 'react-icons/md'
import './components.css'

const CartSummary = ({ cart, onCheckout }) => {
  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-summary">
        <div className="empty-cart">
          <MdShoppingCart size={64} />
          <h3>Your cart is empty</h3>
          <p>Add some beautiful sarees to your cart</p>
          <Link to="/products" className="btn btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  const shipping = cart.totalAmount >= 999 ? 0 : 50
  const tax = Math.round(cart.totalAmount * 0.18 * 100) / 100
  const total = cart.totalAmount + shipping + tax

  return (
    <div className="cart-summary">
      <h3>Order Summary</h3>

      <div className="summary-row">
        <span>Subtotal ({cart.totalItems} items)</span>
        <span>{formatPrice(cart.totalAmount)}</span>
      </div>

      <div className="summary-row">
        <span>Shipping</span>
        <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
      </div>

      {cart.totalAmount < 999 && (
        <p className="free-shipping-msg">
          Add ₹{999 - cart.totalAmount} more for free shipping
        </p>
      )}

      <div className="summary-row">
        <span>Tax (18% GST)</span>
        <span>{formatPrice(tax)}</span>
      </div>

      <hr />

      <div className="summary-row summary-total">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      <button onClick={onCheckout} className="btn btn-primary btn-block">
        Proceed to Checkout
      </button>

      <Link to="/products" className="btn btn-secondary btn-block">
        Continue Shopping
      </Link>
    </div>
  )
}

export default CartSummary
