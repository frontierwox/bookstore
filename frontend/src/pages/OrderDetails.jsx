import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { orderApi } from '../services/orders';

const OrderDetails = () => {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await orderApi.getOrderById(id);
        setOrder(data.order);
      } catch (e) {
        console.error('Failed to fetch order', e);
        setError(e.response?.data?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const formatPrice = (price) => `₹${(price || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <Link to="/orders" className="d-flex align-items-center mb-4 text-decoration-none">
          <IoArrowBack className="me-2" /> Back to Orders
        </Link>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-4">
        <Link to="/orders" className="d-flex align-items-center mb-4 text-decoration-none">
          <IoArrowBack className="me-2" /> Back to Orders
        </Link>
        <p>Order not found.</p>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <Link to="/orders" className="d-flex align-items-center mb-4 text-decoration-none">
        <IoArrowBack className="me-2" /> Back to Orders
      </Link>

      {location.state?.success && (
        <div className="alert alert-success">{location.state?.message || 'Order placed successfully!'}</div>
      )}

      <div className="card mb-4">
        <div className="card-header">
          <h2>Order #{order.orderNumber}</h2>
          <p style={{ margin: 0, color: '#666' }}>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="card-body">
          <p>
            <strong>Status:</strong> {order.status}
            <br />
            <strong>Payment:</strong> {order.paymentStatus}
          </p>

          <h3>Shipping Address</h3>
          <p>
            <strong>{order.shippingAddress?.name}</strong>
            <br />
            {order.shippingAddress?.address}
            <br />
            {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            <br />
            {order.shippingAddress?.phone}
          </p>

          <h3>Items</h3>
          <div className="order-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item" style={{ display: 'flex', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #eee' }}>
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                  <p style={{ margin: '0.25rem 0', color: '#666' }}>
                    Qty: {item.quantity}
                    {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                    {item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>{formatPrice(item.price)}</div>
                  <div style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            {order.originalSubtotal ? <p>Original Subtotal: {formatPrice(order.originalSubtotal)}</p> : null}
            {(order.discountApplied || order.discount) ? (
              <p>Discount: -{formatPrice(order.discountApplied || order.discount)}</p>
            ) : null}
            <p>Subtotal: {formatPrice(order.subtotal)}</p>
            <p>Shipping: {formatPrice(order.shippingCost)}</p>
            <p>Tax: {formatPrice(order.tax)}</p>
            <p style={{ fontSize: '1.1rem' }}>
              <strong>Total: {formatPrice(order.totalAmount)}</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Status Timeline</h3>
        </div>
        <div className="card-body">
          {order.statusHistory?.length ? (
            <ul>
              {order.statusHistory.map((h, idx) => (
                <li key={idx}>
                  <strong>{h.status}</strong> - {new Date(h.timestamp).toLocaleString('en-IN')}
                  {h.note ? ` (${h.note})` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tracking updates yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
