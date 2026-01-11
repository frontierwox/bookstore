import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md'
import { productsApi } from '../services/products'
import './pages.css'

const ProductManagement = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [categoryFilter])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (categoryFilter) params.category = categoryFilter
      const data = await productsApi.getAllProducts(params)
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsApi.deleteProduct(id)
        fetchProducts()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.description.toLowerCase().includes(search.toLowerCase())
  )

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  const categories = ['silk', 'cotton', 'chiffon', 'georgette', 'crepe', 'banarasi', 'kanchipuram', 'other']

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Product Management</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          <MdAdd size={20} />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <MdSearch size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="form-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product._id}>
                  <td>
                    <div className="product-cell">
                      {product.images?.[0] && (
                        <img src={product.images[0].url} alt={product.name} />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    {product.discountedPrice ? (
                      <>
                        <span className="strike">{formatPrice(product.price)}</span>
                        <span>{formatPrice(product.discountedPrice)}</span>
                      </>
                    ) : (
                      formatPrice(product.price)
                    )}
                  </td>
                  <td>
                    <span className={`stock-badge ${product.stock <= 10 ? 'low' : 'ok'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.featured ? '✓' : '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link
                        to={`/admin/products/${product._id}/edit`}
                        className="btn btn-sm btn-secondary"
                      >
                        <MdEdit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="btn btn-sm btn-danger"
                      >
                        <MdDelete size={16} />
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

export default ProductManagement
