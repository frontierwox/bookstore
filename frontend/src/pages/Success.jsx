import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { IoCheckmarkCircle } from 'react-icons/io5';

const Success = () => {
  const location = useLocation();
  const [params] = useSearchParams();

  const orderId = params.get('orderId') || location.state?.orderId;
  const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="container py-5 text-center">
      <div className="success-icon mb-4">
        <IoCheckmarkCircle size={80} color="var(--success-color)" />
      </div>
      <h1>Order Placed Successfully!</h1>
      <p className="lead mb-2">Thank you for your purchase. Your order has been received.</p>
      <p className="mb-4">Check your email for confirmation and updates.</p>

      {orderId && (
        <div className="card" style={{ maxWidth: 520, margin: '0 auto 1.5rem', padding: '1rem' }}>
          <p style={{ margin: 0 }}>
            <strong>Order ID:</strong> {orderId}
          </p>
          <p style={{ margin: '0.5rem 0 0 0' }}>
            <strong>Estimated Delivery:</strong> {estimatedDelivery.toLocaleDateString('en-IN')}
          </p>
        </div>
      )}

      <div className="d-flex justify-content-center gap-3">
        <Link to="/orders" className="btn btn-primary">
          View My Orders
        </Link>
        <Link to="/products" className="btn btn-outline">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default Success;
