import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney,
  MdShoppingCart,
  MdPeople,
  MdLocalShipping,
  MdEmail,
  MdVisibility,
  MdDownload,
  MdFilterList,
  MdDateRange
} from 'react-icons/md'
import { adminApi } from '../services/admin'
import './AdminDashboards.css'

const SalesAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [discountAnalytics, setDiscountAnalytics] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [currentPage, setCurrentPage] = useState(1)
  const [orderFilters, setOrderFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    fetchAnalytics()
    fetchTopProducts()
    fetchDiscountAnalytics()
    fetchOrders()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getAnalyticsOverview({ period })
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopProducts = async () => {
    try {
      const data = await adminApi.getTopSellingProducts({ period, limit: 10 })
      setTopProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching top products:', error)
    }
  }

  const fetchDiscountAnalytics = async () => {
    try {
      const data = await adminApi.getDiscountAnalytics({ period })
      setDiscountAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching discount analytics:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const params = {
        page: currentPage,
        limit: 10,
        ...orderFilters
      }
      const data = await adminApi.getOrders(params)
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await adminApi.updateOrderStatus(orderId, { status: newStatus })
      fetchOrders()
      fetchAnalytics()
      alert('Order status updated successfully!')
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    }
  }

  const handleResendEmail = async (orderId, emailType) => {
    try {
      await adminApi.resendOrderEmail(orderId, { emailType })
      alert(`${emailType} email resent successfully!`)
    } catch (error) {
      console.error('Error resending email:', error)
      alert('Failed to resend email')
    }
  }

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString('en-IN') || '0'}`
  }

  const formatGrowth = (growth) => {
    if (growth > 0) {
      return { value: `+${growth.toFixed(1)}%`, class: 'growth-positive' }
    } else if (growth < 0) {
      return { value: `${growth.toFixed(1)}%`, class: 'growth-negative' }
    } else {
      return { value: '0.0%', class: 'growth-neutral' }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      processing: '#9c27b0',
      shipped: '#607d8b',
      delivered: '#4caf50',
      cancelled: '#f44336',
      refunded: '#795548'
    }
    return colors[status] || '#757575'
  }

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' }
  ]

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="sales-analytics">
      <div className="dashboard-header">
        <h1>Sales & Analytics</h1>
        <div className="header-controls">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-select"
          >
            {periods.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button className="btn btn-secondary">
            <MdDownload size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon revenue">
            <MdAttachMoney size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">
              {formatPrice(analytics?.overview?.revenue?.current)}
            </p>
            <div className="stat-change">
              {analytics?.overview?.revenue?.growth !== undefined && (
                <span className={formatGrowth(analytics.overview.revenue.growth).class}>
                  {formatGrowth(analytics.overview.revenue.growth).value}
                  {analytics.overview.revenue.growth > 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                </span>
              )}
              <span className="stat-period">vs last {period}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">
            <MdShoppingCart size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">
              {analytics?.overview?.orders?.current || 0}
            </p>
            <div className="stat-change">
              {analytics?.overview?.orders?.growth !== undefined && (
                <span className={formatGrowth(analytics.overview.orders.growth).class}>
                  {formatGrowth(analytics.overview.orders.growth).value}
                  {analytics.overview.orders.growth > 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                </span>
              )}
              <span className="stat-period">vs last {period}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon aov">
            <MdLocalShipping size={24} />
          </div>
          <div className="stat-content">
            <h3>Average Order Value</h3>
            <p className="stat-value">
              {formatPrice(analytics?.overview?.averageOrderValue?.current)}
            </p>
            <div className="stat-change">
              {analytics?.overview?.averageOrderValue?.growth !== undefined && (
                <span className={formatGrowth(analytics.overview.averageOrderValue.growth).class}>
                  {formatGrowth(analytics.overview.averageOrderValue.growth).value}
                  {analytics.overview.averageOrderValue.growth > 0 ? <MdTrendingUp /> : <MdTrendingDown />}
                </span>
              )}
              <span className="stat-period">vs last {period}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <MdPeople size={24} />
          </div>
          <div className="stat-content">
            <h3>New Customers</h3>
            <p className="stat-value">
              {analytics?.overview?.customers?.newInPeriod || 0}
            </p>
            <div className="stat-change">
              <span className="stat-period">in {period}</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon conversion">
            <MdTrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Conversion Rate</h3>
            <p className="stat-value">
              {analytics?.overview?.orders?.current && analytics?.overview?.customers?.total 
                ? ((analytics.overview.orders.current / analytics.overview.customers.total) * 100).toFixed(1)
                : 0}%
            </p>
            <div className="stat-change">
              <span className="stat-period">estimated</span>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <MdLocalShipping size={24} />
          </div>
          <div className="stat-content">
            <h3>Pending Orders</h3>
            <p className="stat-value">
              {analytics?.overview?.orders?.current - analytics?.overview?.orders?.current * 0.8 || 0}
            </p>
            <div className="stat-change">
              <span className="stat-period">awaiting processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Revenue Trend</h3>
          <div className="chart-placeholder">
            <p>Monthly Revenue Chart</p>
            {analytics?.monthlySales && analytics.monthlySales.length > 0 ? (
              <div className="chart-data">
                {analytics.monthlySales.map((month, index) => (
                  <div key={index} className="chart-bar">
                    <div className="bar" style={{ height: `${(month.revenue / Math.max(...analytics.monthlySales.map(m => m.revenue))) * 100}%` }}></div>
                    <span className="bar-label">
                      {new Date(2024, month._id.month - 1).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>

        <div className="chart-container">
          <h3>Order Status Distribution</h3>
          <div className="chart-placeholder">
            <div className="pie-chart">
              {analytics?.orderStatusBreakdown?.map((status, index) => (
                <div key={status._id} className="pie-segment" style={{
                  '--color': getStatusColor(status._id),
                  '--percentage': `${(status.count / analytics.orderStatusBreakdown.reduce((sum, s) => sum + s.count, 0)) * 100}%`
                }}>
                  <span className="pie-label">{status._id}</span>
                  <span className="pie-value">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="top-products-section">
        <h3>Top Selling Products</h3>
        <div className="top-products-grid">
          {topProducts.map((product, index) => (
            <div key={product._id} className="top-product-card">
              <div className="product-rank">#{index + 1}</div>
              <div className="product-info">
                {product.image && (
                  <img src={product.image} alt={product.name} className="product-image" />
                )}
                <div className="product-details">
                  <h4>{product.name}</h4>
                  <p className="product-category">{product.category}</p>
                  <div className="product-stats">
                    <span>Sold: {product.totalSold}</span>
                    <span>Revenue: {formatPrice(product.revenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="orders-section">
        <div className="section-header">
          <h3>Recent Orders</h3>
          <Link to="/admin/orders" className="btn btn-secondary btn-sm">
            View All Orders
          </Link>
        </div>
        
        <div className="orders-filters">
          <input
            type="text"
            placeholder="Search orders..."
            value={orderFilters.search}
            onChange={(e) => setOrderFilters(prev => ({ ...prev, search: e.target.value }))}
            className="search-input"
          />
          <select
            value={orderFilters.status}
            onChange={(e) => setOrderFilters(prev => ({ ...prev, status: e.target.value }))}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td className="order-number">
                    <strong>{order.orderNumber}</strong>
                  </td>
                  <td>
                    <div className="customer-info">
                      <span>{order.user?.name || 'Guest'}</span>
                      <small>{order.user?.email || order.customerEmail}</small>
                    </div>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="amount">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                      className="status-select"
                      style={{ '--status-color': getStatusColor(order.status) }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => window.open(`/admin/orders/${order._id}`, '_blank')}
                        className="btn-icon"
                        title="View Details"
                      >
                        <MdVisibility size={16} />
                      </button>
                      <button
                        onClick={() => handleResendEmail(order._id, 'confirmation')}
                        className="btn-icon"
                        title="Resend Email"
                      >
                        <MdEmail size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discount Analytics */}
      {discountAnalytics && (
        <div className="discount-analytics-section">
          <h3>Discount Impact Analysis</h3>
          <div className="discount-stats-grid">
            <div className="discount-stat-card">
              <h4>Total Discount Given</h4>
              <p className="stat-value">
                {formatPrice(discountAnalytics.overall?.totalDiscount || 0)}
              </p>
            </div>
            <div className="discount-stat-card">
              <h4>Orders with Discount</h4>
              <p className="stat-value">
                {discountAnalytics.overall?.ordersWithDiscount || 0}
              </p>
            </div>
            <div className="discount-stat-card">
              <h4>Discount Rate</h4>
              <p className="stat-value">
                {discountAnalytics.overall?.totalOrders 
                  ? ((discountAnalytics.overall.ordersWithDiscount / discountAnalytics.overall.totalOrders) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>

          {discountAnalytics.byCategory && discountAnalytics.byCategory.length > 0 && (
            <div className="category-discounts">
              <h4>Discount by Category</h4>
              <div className="category-discount-list">
                {discountAnalytics.byCategory.map(category => (
                  <div key={category._id} className="category-discount-item">
                    <span className="category-name">{category._id}</span>
                    <span className="category-discount">
                      {formatPrice(category.totalDiscount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SalesAnalyticsDashboard