import { useState, useEffect } from 'react'
import { MdTrendingDown, MdAdd, MdEdit } from 'react-icons/md'
import { adminApi } from '../services/admin'

const StockControl = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(10)

  useEffect(() => {
    fetchLowStockProducts()
  }, [threshold])

  const fetchLowStockProducts = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getLowStockProducts(threshold)
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching low stock products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Stock Control</h1>
        <div className="header-actions">
          <div className="stock-threshold">
            <label>Alert Threshold:</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              min="0"
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Stock Summary */}
      <div className="stock-summary">
        <div className="summary-card summary-warning">
          <MdTrendingDown size={32} />
          <div>
            <h3>{products.length}</h3>
            <p>Low Stock Products</p>
          </div>
        </div>
      </div>

      {/* Low Stock Products Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading stock data...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <h3>All Stock Levels Healthy</h3>
          <p>Products are above the threshold of {threshold}</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>
                    <span className="stock-value">{product.stock}</span>
                  </td>
                  <td>
                    {product.stock === 0 ? (
                      <span className="status-badge status-critical">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="status-badge status-warning">
                        Low Stock
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-primary">
                        <MdAdd size={16} />
                        Restock
                      </button>
                      <button className="btn btn-sm btn-secondary">
                        <MdEdit size={16} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StockControl
