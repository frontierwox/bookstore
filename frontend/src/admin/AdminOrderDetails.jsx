import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../services/admin';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrderDetails(id);
      setOrder(data.order);
    } catch (e) {
      console.error('Failed to fetch order', e);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `₹${(price || 0).toLocaleString('en-IN')}`;

  const handleStatusUpdate = async (status) => {
    try {
      setUpdating(true);
      await adminApi.updateOrderStatus(id, { status });
      await fetchOrder();
      alert('Order status updated');
    } catch (e) {
      console.error('Failed to update status', e);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleResend = async (emailType) => {
    try {
      setUpdating(true);
      await adminApi.resendOrderEmail(id, { emailType });
      alert('Email sent');
      await fetchOrder();
    } catch (e) {
      console.error('Failed to resend email', e);
      alert('Failed to resend email');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page">
        <div className="empty-state">
          <h3>Order not found</h3>
          <Link to="/admin/orders" className="btn btn-secondary">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>Order #{order.orderNumber}</h1>
          <p>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <Link to="/admin/orders" className="btn btn-secondary">
          Back to Orders
        </Link>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Customer</h3>
        <p>
          <strong>{order.shippingAddress?.name}</strong>
          <br />
          {order.customerEmail}
          <br />
          {order.customerPhone}
        </p>

        <h3>Shipping Address</h3>
        <p>
          {order.shippingAddress?.address}
          <br />
          {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
        </p>

        <h3>Payment</h3>
        <p>
          Method: <strong>{String(order.paymentMethod).toUpperCase()}</strong>
          <br />
          Status: <strong>{order.paymentStatus}</strong>
        </p>

        <h3>Status</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={order.status}
            onChange={(e) => handleStatusUpdate(e.target.value)}
            disabled={updating}
            className="form-control"
            style={{ maxWidth: 220 }}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          {updating && <span>Updating...</span>}
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" type="button" disabled={updating} onClick={() => handleResend('confirmation')}>
            Resend Confirmation
          </button>
          <button className="btn btn-secondary" type="button" disabled={updating} onClick={() => handleResend('shipped')}>
            Resend Shipped
          </button>
          <button className="btn btn-secondary" type="button" disabled={updating} onClick={() => handleResend('delivered')}>
            Resend Delivered
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Items</h3>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    {item.name}
                    {item.selectedSize ? ` | Size: ${item.selectedSize}` : ''}
                    {item.selectedColor ? ` | Color: ${item.selectedColor}` : ''}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <p>Original Subtotal: {formatPrice(order.originalSubtotal)}</p>
          <p>Discount Applied: -{formatPrice(order.discountApplied || order.discount || 0)}</p>
          <p>Subtotal: {formatPrice(order.subtotal)}</p>
          <p>Shipping: {formatPrice(order.shippingCost)}</p>
          <p>Tax: {formatPrice(order.tax)}</p>
          <p style={{ fontSize: '1.1rem' }}>
            <strong>Total: {formatPrice(order.totalAmount)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
