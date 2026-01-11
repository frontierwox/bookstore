import { useState, useEffect } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  MdDashboard,
  MdShoppingBag,
  MdCategory,
  MdPeople,
  MdAssignment,
  MdAnalytics,
  MdSettings,
  MdLogout
} from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import { adminApi } from '../services/admin'
import './pages.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/')
      return
    }
    fetchDashboardStats()
  }, [user, navigate])

  const fetchDashboardStats = async () => {
    try {
      const data = await adminApi.getDashboardStats()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString('en-IN') || '0'}`
  }

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: MdDashboard },
    { path: '/admin/products', label: 'Products', icon: MdShoppingBag },
    { path: '/admin/orders', label: 'Orders', icon: MdAssignment },
    { path: '/admin/users', label: 'Users', icon: MdPeople },
    { path: '/admin/analytics', label: 'Analytics', icon: MdAnalytics },
    { path: '/admin/settings', label: 'Settings', icon: MdSettings }
  ]

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <MdLogout size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* Header */}
        <header className="admin-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <h1>Admin Dashboard</h1>
          <div className="admin-user">
            <span>{user?.name}</span>
            <span className="badge badge-admin">Admin</span>
          </div>
        </header>

        {/* Dashboard Stats (only on main dashboard page) */}
        {location.pathname === '/admin' && (
          <>
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
              </div>
            ) : (
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
                  <div className="stat-icon stat-today">📅</div>
                  <div className="stat-info">
                    <h3>Today's Orders</h3>
                    <p className="stat-value">{stats?.todaysOrders || 0}</p>
                    <span className="stat-label">Orders today</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h2>Quick Actions</h2>
              <div className="action-grid">
                <Link to="/admin/products/new" className="action-card">
                  <span className="action-icon">➕</span>
                  <h3>Add Product</h3>
                </Link>
                <Link to="/admin/orders" className="action-card">
                  <span className="action-icon">📋</span>
                  <h3>View Orders</h3>
                </Link>
                <Link to="/admin/users" className="action-card">
                  <span className="action-icon">👤</span>
                  <h3>Manage Users</h3>
                </Link>
                <Link to="/admin/analytics" className="action-card">
                  <span className="action-icon">📊</span>
                  <h3>View Analytics</h3>
                </Link>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="recent-orders-section">
              <div className="section-header">
                <h2>Recent Orders</h2>
                <Link to="/admin/orders" className="btn btn-secondary btn-sm">
                  View All
                </Link>
              </div>
              <div className="recent-orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentOrders?.map(order => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.user?.name || 'N/A'}</td>
                        <td>{formatPrice(order.totalAmount)}</td>
                        <td>
                          <span className={`status-badge status-${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td>
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="btn btn-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Nested Routes */}
        <Outlet />
      </main>
    </div>
  )
}

export default AdminDashboard
