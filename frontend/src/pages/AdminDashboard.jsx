import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/admin';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboardStats();
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `₹${(price || 0).toLocaleString('en-IN')}`;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Dashboard Overview</h1>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon stat-revenue">💰</div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p className="stat-value">{formatPrice(stats?.totalRevenue)}</p>
            <span className="stat-label">Lifetime earnings</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-orders">📦</div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats?.totalOrders || 0}</p>
            <span className="stat-label">All time orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-users">👥</div>
          <div className="stat-info">
            <h3>Total Users</h3>
            <p className="stat-value">{stats?.totalUsers || 0}</p>
            <span className="stat-label">Registered users</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-products">👗</div>
          <div className="stat-info">
            <h3>Total Products</h3>
            <p className="stat-value">{stats?.totalProducts || 0}</p>
            <span className="stat-label">Active products</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-pending">⏳</div>
          <div className="stat-info">
            <h3>Pending Orders</h3>
            <p className="stat-value">{stats?.pendingOrders || 0}</p>
            <span className="stat-label">Awaiting processing</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-low-stock">📉</div>
          <div className="stat-info">
            <h3>Low Stock</h3>
            <p className="stat-value">{stats?.lowStockProducts || 0}</p>
            <span className="stat-label">Below threshold</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <Link to="/admin/products/new" className="action-card">
            <span className="action-icon">➕</span>
            <h3>Add Product</h3>
          </Link>
          <Link to="/admin/orders" className="action-card">
            <span className="action-icon">📋</span>
            <h3>Manage Orders</h3>
          </Link>
          <Link to="/admin/analytics" className="action-card">
            <span className="action-icon">📊</span>
            <h3>View Analytics</h3>
          </Link>
          <Link to="/admin/stock" className="action-card">
            <span className="action-icon">🏷️</span>
            <h3>Stock Control</h3>
          </Link>
        </div>
      </div>

      <div className="recent-orders-section">
        <div className="section-header">
          <h2>Recent Orders</h2>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-state">
            <p>No recent orders.</p>
          </div>
        ) : (
          <div className="recent-orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || 'N/A'}</td>
                    <td>{formatPrice(order.totalAmount)}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <Link to={`/admin/orders/${order._id}`} className="btn btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
