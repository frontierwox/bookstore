import React from 'react';
import { Link } from 'react-router-dom';
import { IoCheckmarkCircle } from 'react-icons/io5';

const Success = () => {
  return (
    <div className="container py-5 text-center">
      <div className="success-icon mb-4">
        <IoCheckmarkCircle size={80} color="var(--success-color)" />
      </div>
      <h1>Order Placed Successfully!</h1>
      <p className="lead mb-4">Thank you for your purchase. Your order has been received and is being processed.</p>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/orders" className="btn btn-primary">View My Orders</Link>
        <Link to="/products" className="btn btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default Success;
