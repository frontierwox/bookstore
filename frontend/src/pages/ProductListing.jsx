import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import { productsApi } from '../services/products'
import './pages.css'

const ProductListing = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const categoryParam = searchParams.get('category')
  const searchParam = searchParams.get('search')

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit
        }

        if (categoryParam) params.category = categoryParam
        if (searchParam) params.search = searchParam

        const data = await productsApi.getAllProducts(params)
        setProducts(data.products || [])
        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          total: data.total
        }))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [pagination.page, categoryParam, searchParam])

  const handleFilterChange = (filters) => {
    setProducts([])
    // Implement filter logic
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="product-listing-page">
      <div className="page-header">
        <h1>
          {categoryParam
            ? `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Sarees`
            : searchParam
            ? `Search Results for "${searchParam}"`
            : 'All Sarees'}
        </h1>
        <p>{pagination.total} products found</p>
      </div>

      <div className="listing-layout">
        {/* Filter Sidebar */}
        <aside className="sidebar">
          <FilterSidebar onFilterChange={handleFilterChange} />
        </aside>

        {/* Products Grid */}
        <main className="products-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default ProductListing
