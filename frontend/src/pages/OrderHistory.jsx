import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MdOutlineVisibility, MdLocalShipping, MdCheckCircle, MdCancel } from 'react-icons/md'
import { orderApi } from '../services/orders'
import './pages.css'

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchOrders()
  }, [filter, page])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params = { page, limit: 10 }
      if (filter !== 'all') {
        params.status = filter
      }
      const data = await orderApi.getUserOrders(params)
      setOrders(data.orders || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <MdLocalShipping size={24} className="status-pending" />
      case 'confirmed':
        return <MdLocalShipping size={24} className="status-confirmed" />
      case 'processing':
        return <MdLocalShipping size={24} className="status-processing" />
      case 'shipped':
        return <MdLocalShipping size={24} className="status-shipped" />
      case 'delivered':
        return <MdCheckCircle size={24} className="status-delivered" />
      case 'cancelled':
        return <MdCancel size={24} className="status-cancelled" />
      default:
        return <MdLocalShipping size={24} />
    }
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="order-history-page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>{total} {total === 1 ? 'order' : 'orders'}</p>
      </div>

      {/* Filter */}
      <div className="order-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Orders
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilter('delivered')}
        >
          Delivered
        </button>
        <button
          className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet</p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.orderNumber}</h3>
                  <p>{formatDate(order.createdAt)}</p>
                </div>
                <div className={`order-status status-${order.status}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                </div>
              </div>

              <div className="order-items">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="order-item">
                    {item.image && (
                      <img src={item.image} alt={item.name} />
                    )}
                    <div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="more-items">
                    +{order.items.length - 3} more items
                  </div>
                )}
              </div>

              <div className="order-footer">
                <span className="order-total">Total: {formatPrice(order.totalAmount)}</span>
                <Link
                  to={`/orders/${order._id}`}
                  className="btn btn-secondary btn-sm"
                >
                  <MdOutlineVisibility size={18} />
                  View Details
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {total > 10 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={orders.length < 10}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderHistory
