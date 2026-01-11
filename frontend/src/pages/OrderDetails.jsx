import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch order details logic will go here
    setLoading(false);
  }, [id]);

  if (loading) return <div>Loading order details...</div>;

  return (
    <div className="container py-4">
      <Link to="/orders" className="d-flex align-items-center mb-4 text-decoration-none">
        <IoArrowBack className="me-2" /> Back to Orders
      </Link>
      
      <div className="card mb-4">
        <div className="card-header">
          <h2>Order #{id}</h2>
        </div>
        <div className="card-body">
          <p>Order details for {id} will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
