import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdFilterList,
  MdVisibility,
  MdTrendingUp,
  MdTrendingDown,
  MdAttachMoney,
  MdInventory
} from 'react-icons/md'
import { adminApi } from '../../services/admin'
import './AdminDashboards.css'

const ProductManagementDashboard = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterDiscount, setFilterDiscount] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [currentPage, searchTerm, filterCategory, filterDiscount])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        category: filterCategory,
        hasDiscount: filterDiscount === 'yes' ? true : filterDiscount === 'no' ? false : undefined
      }
      const response = await adminApi.getProducts(params)
      setProducts(response.products || [])
      setTotalPages(Math.ceil((response.total || 0) / 20))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const data = await adminApi.getDashboardStats()
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await adminApi.deleteProduct(productId)
        fetchProducts()
        fetchStats()
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product')
      }
    }
  }

  const handleUpdateDiscount = async (productId, discountData) => {
    try {
      await adminApi.updateProductDiscount(productId, discountData)
      fetchProducts()
      fetchStats()
      alert('Discount updated successfully!')
    } catch (error) {
      console.error('Error updating discount:', error)
      alert('Failed to update discount')
    }
  }

  const formatPrice = (price) => {
    return `₹${price?.toLocaleString('en-IN') || '0'}`
  }

  const getFinalPrice = (product) => {
    if (product.discountPercentage > 0) {
      const discountAmount = (product.price * product.discountPercentage) / 100
      return product.price - discountAmount
    }
    return product.price
  }

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'silk', label: 'Silk' },
    { value: 'cotton', label: 'Cotton' },
    { value: 'chiffon', label: 'Chiffon' },
    { value: 'georgette', label: 'Georgette' },
    { value: 'crepe', label: 'Crepe' },
    { value: 'banarasi', label: 'Banarasi' },
    { value: 'kanchipuram', label: 'Kanchipuram' },
    { value: 'other', label: 'Other' }
  ]

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', class: 'stock-out' }
    if (stock < 10) return { text: 'Low Stock', class: 'stock-low' }
    return { text: 'In Stock', class: 'stock-ok' }
  }

  return (
    <div className="product-management">
      <div className="dashboard-header">
        <h1>Product Management</h1>
        <div className="header-actions">
          <Link to="/admin/products/new" className="btn btn-primary">
            <MdAdd size={20} />
            Add New Product
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <MdInventory size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">{stats?.totalProducts || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon discount">
            <MdAttachMoney size={24} />
          </div>
          <div className="stat-content">
            <h3>Products with Discount</h3>
            <p className="stat-value">
              {stats?.productsWithDiscounts || 0}
            </p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon low-stock">
            <MdTrendingDown size={24} />
          </div>
          <div className="stat-content">
            <h3>Low Stock</h3>
            <p className="stat-value">{stats?.lowStockProducts || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon out-of-stock">
            <MdTrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>Out of Stock</h3>
            <p className="stat-value">
              {products.filter(p => p.stock === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={filterDiscount}
          onChange={(e) => setFilterDiscount(e.target.value)}
          className="filter-select"
        >
          <option value="">All Products</option>
          <option value="yes">With Discount</option>
          <option value="no">No Discount</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Original Price</th>
                <th>Discount</th>
                <th>Final Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stockStatus = getStockStatus(product.stock)
                const finalPrice = getFinalPrice(product)
                
                return (
                  <tr key={product._id}>
                    <td className="product-cell">
                      <div className="product-info">
                        {product.images?.[0]?.url && (
                          <img 
                            src={product.images[0].url} 
                            alt={product.name}
                            className="product-thumb"
                          />
                        )}
                        <div>
                          <h4>{product.name}</h4>
                          <p className="product-sku">SKU: {product._id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{product.category}</span>
                    </td>
                    <td className="price-cell">
                      {formatPrice(product.price)}
                    </td>
                    <td>
                      {product.discountPercentage > 0 ? (
                        <div className="discount-info">
                          <span className="discount-badge">
                            {product.discountPercentage}% OFF
                          </span>
                          <p className="discount-save">
                            Save {formatPrice(product.price - finalPrice)}
                          </p>
                        </div>
                      ) : (
                        <span className="no-discount">No discount</span>
                      )}
                    </td>
                    <td className="price-cell">
                      <strong>{formatPrice(finalPrice)}</strong>
                    </td>
                    <td>
                      <span className={`stock-badge ${stockStatus.class}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${stockStatus.class}`}>
                        {stockStatus.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="btn-icon"
                          title="Edit Product"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="btn-icon delete"
                          title="Delete Product"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="btn-pagination"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="btn-pagination"
          >
            Next
          </button>
        </div>
      )}

      {/* Discount Update Modal */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Update Discount - {editingProduct.name}</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Current Price: {formatPrice(editingProduct.price)}</label>
              </div>
              
              <DiscountForm 
                product={editingProduct}
                onUpdate={(discountData) => {
                  handleUpdateDiscount(editingProduct._id, discountData)
                  setEditingProduct(null)
                }}
                onCancel={() => setEditingProduct(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Discount Form Component
const DiscountForm = ({ product, onUpdate, onCancel }) => {
  const [discountPercentage, setDiscountPercentage] = useState(product.discountPercentage || 0)
  const [startDate, setStartDate] = useState(
    product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : ''
  )

  const calculateFinalPrice = () => {
    if (discountPercentage > 0) {
      const discountAmount = (product.price * discountPercentage) / 100
      return product.price - discountAmount
    }
    return product.price
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const discountData = {
      discountPercentage: parseInt(discountPercentage),
      discountStartDate: startDate || null,
      discountEndDate: endDate || null
    }
    onUpdate(discountData)
  }

  return (
    <form onSubmit={handleSubmit} className="discount-form">
      <div className="form-group">
        <label htmlFor="discountPercentage">Discount Percentage (%)</label>
        <input
          type="number"
          id="discountPercentage"
          min="0"
          max="100"
          value={discountPercentage}
          onChange={(e) => setDiscountPercentage(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Start Date (Optional)</label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="endDate">End Date (Optional)</label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <div className="price-preview">
        <h4>Price Preview</h4>
        <p>Original Price: ₹{product.price.toLocaleString('en-IN')}</p>
        <p>Discount: {discountPercentage}%</p>
        <p>Final Price: <strong>₹{calculateFinalPrice().toLocaleString('en-IN')}</strong></p>
      </div>

      <div className="modal-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Update Discount
        </button>
      </div>
    </form>
  )
}

export default ProductManagementDashboard