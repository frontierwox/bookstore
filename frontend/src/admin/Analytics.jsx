import { useState, useEffect } from 'react'
import { adminApi } from '../services/admin'

const Analytics = () => {
  const [salesData, setSalesData] = useState(null)
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const [sales, products] = await Promise.all([
        adminApi.getSalesAnalytics({ period }),
        adminApi.getProductAnalytics()
      ])
      setSalesData(sales.analytics)
      setProductData(products.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString('en-IN') || '0'}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Analytics</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="form-select"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Sales Overview */}
      <div className="analytics-overview">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p className="stat-value">{formatPrice(salesData?.totalRevenue)}</p>
          <span className="stat-label">{period} sales</span>
        </div>
        <div className="stat-card">
          <h3>Total Orders</h3>
          <p className="stat-value">{salesData?.totalOrders || 0}</p>
          <span className="stat-label">{period} orders</span>
        </div>
        <div className="stat-card">
          <h3>Average Order Value</h3>
          <p className="stat-value">{formatPrice(salesData?.avgOrderValue)}</p>
          <span className="stat-label">Per order</span>
        </div>
      </div>

      {/* Sales by Category */}
      <div className="analytics-section">
        <h2>Sales by Category</h2>
        {salesData?.categorySales && (
          <div className="category-sales-chart">
            {Object.entries(salesData.categorySales).map(([category, data]) => (
              <div key={category} className="category-bar">
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{ width: `${(data.count / 50) * 100}%` }}
                  ></div>
                </div>
                <div className="bar-label">
                  <span>{category}</span>
                  <span className="bar-value">{data.count} sold</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products */}
      <div className="analytics-section">
        <h2>Top Selling Products</h2>
        {productData?.topSelling && (
          <div className="top-products-list">
            {productData.topSelling.map((product, index) => (
              <div key={index} className="top-product-item">
                <span className="rank">{index + 1}</span>
                <div className="product-info">
                  <p className="product-name">{product.name}</p>
                  <p className="product-category">{product.category}</p>
                </div>
                <div className="product-stats">
                  <p>{product.totalSold} sold</p>
                  <p>{formatPrice(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics
