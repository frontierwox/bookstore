import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import { productsApi } from '../services/products'

const ProductListing = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    sortBy: 'newest'
  })
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
          limit: pagination.limit,
          sort: filters.sortBy
        }

        const category = categoryParam || filters.category
        if (category) params.category = category
        if (searchParam) params.search = searchParam
        if (filters.minPrice) params.minPrice = filters.minPrice
        if (filters.maxPrice) params.maxPrice = filters.maxPrice
        if (filters.inStock) params.inStock = true

        const data = await productsApi.getProducts(params)
        setProducts(data.products || [])

        setPagination(prev => ({
          ...prev,
          ...data.pagination,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0
        }))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [pagination.page, categoryParam, searchParam, filters])

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
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
