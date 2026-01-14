import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import { productsApi } from '../services/products'

const ProductListing = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [showFilters, setShowFilters] = useState(false)
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
    setShowFilters(false) // Close mobile filter on apply
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      sortBy: 'newest'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <div className="product-listing-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="title-section">
              <h1 className="page-title">
                {categoryParam
                  ? `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)} Sarees`
                  : searchParam
                  ? `Search Results for "${searchParam}"`
                  : 'All Sarees'}
              </h1>
              <p className="product-count">{pagination.total} products found</p>
            </div>

            {/* Mobile/Tablet Controls */}
            <div className="mobile-controls">
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filters</span>
                {(filters.category || filters.minPrice || filters.maxPrice || filters.inStock) && (
                  <span className="filter-badge"></span>
                )}
              </button>

              <div className="view-toggle">
                <button 
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button 
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="sort-section">
              <label htmlFor="sort" className="sort-label">Sort by:</label>
              <select 
                id="sort"
                className="sort-select"
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ ...filters, sortBy: e.target.value })}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Active Filters Tags */}
          {(filters.category || filters.minPrice || filters.maxPrice || filters.inStock) && (
            <div className="active-filters">
              <span className="filter-label">Active Filters:</span>
              <div className="filter-tags">
                {filters.category && (
                  <span className="filter-tag">
                    {filters.category}
                    <button onClick={() => handleFilterChange({ ...filters, category: '' })}>×</button>
                  </span>
                )}
                {filters.minPrice && (
                  <span className="filter-tag">
                    Min: ₹{filters.minPrice}
                    <button onClick={() => handleFilterChange({ ...filters, minPrice: '' })}>×</button>
                  </span>
                )}
                {filters.maxPrice && (
                  <span className="filter-tag">
                    Max: ₹{filters.maxPrice}
                    <button onClick={() => handleFilterChange({ ...filters, maxPrice: '' })}>×</button>
                  </span>
                )}
                {filters.inStock && (
                  <span className="filter-tag">
                    In Stock Only
                    <button onClick={() => handleFilterChange({ ...filters, inStock: false })}>×</button>
                  </span>
                )}
                <button className="clear-all-btn" onClick={clearFilters}>Clear All</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="listing-layout container">
        {/* Mobile Filter Overlay */}
        {showFilters && (
          <div className="filter-overlay" onClick={() => setShowFilters(false)}></div>
        )}

        {/* Filter Sidebar */}
        <aside className={`sidebar ${showFilters ? 'show' : ''}`}>
          <div className="sidebar-header">
            <h3 className="sidebar-title">Filters</h3>
            <button 
              className="close-btn"
              onClick={() => setShowFilters(false)}
            >
              ×
            </button>
          </div>
          <FilterSidebar onFilterChange={handleFilterChange} currentFilters={filters} />
        </aside>

        {/* Products Grid */}
        <main className="products-container">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="empty-title">No products found</h3>
              <p className="empty-text">Try adjusting your filters or search terms</p>
              <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className={`products-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
                {products.map(product => (
                  <ProductCard key={product._id} product={product} viewMode={viewMode} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="pagination-btn"
                    aria-label="Previous page"
                  >
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="btn-text">Previous</span>
                  </button>

                  <div className="pagination-info">
                    <span className="page-numbers">
                      <span className="current-page">{pagination.page}</span>
                      <span className="separator">/</span>
                      <span className="total-pages">{pagination.totalPages}</span>
                    </span>
                    <span className="page-label">of {pagination.totalPages} pages</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="pagination-btn"
                    aria-label="Next page"
                  >
                    <span className="btn-text">Next</span>
                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style jsx>{`
        .product-listing-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        /* Header Section */
        .page-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1.5rem 0;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .title-section {
          flex: 1;
          min-width: 200px;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 0.25rem 0;
        }

        .product-count {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Mobile Controls */
        .mobile-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .filter-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .filter-toggle-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
        }

        .view-toggle {
          display: none;
          gap: 0.25rem;
          background: #f3f4f6;
          padding: 0.25rem;
          border-radius: 0.5rem;
        }

        .view-btn {
          padding: 0.5rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .view-btn.active {
          background: white;
          color: #111827;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .icon {
          width: 1.25rem;
          height: 1.25rem;
        }

        /* Sort Section */
        .sort-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .sort-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .sort-select {
          padding: 0.625rem 2.5rem 0.625rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: white;
          color: #111827;
          cursor: pointer;
          transition: all 0.2s;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 1.25rem;
        }

        .sort-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        /* Active Filters */
        .active-filters {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          flex-wrap: wrap;
        }

        .filter-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
        }

        .filter-tags {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.75rem;
          background: #eff6ff;
          color: #1e40af;
          border-radius: 9999px;
          font-size: 0.813rem;
          font-weight: 500;
        }

        .filter-tag button {
          background: none;
          border: none;
          color: #1e40af;
          font-size: 1.25rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          margin-left: 0.25rem;
        }

        .clear-all-btn {
          padding: 0.375rem 0.75rem;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.813rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-all-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        /* Layout */
        .listing-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          padding: 2rem 0;
          position: relative;
        }

        /* Filter Overlay */
        .filter-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 45;
        }

        /* Sidebar */
        .sidebar {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 6rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .sidebar-header {
          display: none;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .close-btn {
          display: none;
          background: none;
          border: none;
          font-size: 2rem;
          color: #6b7280;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          width: 2rem;
          height: 2rem;
          align-items: center;
          justify-content: center;
        }

        /* Products Container */
        .products-container {
          min-height: 400px;
        }

        .products-grid {
          display: grid;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .products-grid.grid-view {
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        }

        .products-grid.list-view {
          grid-template-columns: 1fr;
        }

        /* Loading State */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          padding: 3rem 1.5rem;
        }

        .empty-icon {
          width: 4rem;
          height: 4rem;
          color: #d1d5db;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        .empty-text {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
        }

        /* Pagination */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem 0;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .pagination-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .page-numbers {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.125rem;
          font-weight: 600;
          color: #111827;
        }

        .separator {
          color: #d1d5db;
        }

        .page-label {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        /* Responsive Design */
        @media (min-width: 768px) {
          .view-toggle {
            display: flex;
          }

          .products-grid.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          }
        }

        @media (max-width: 1024px) {
          .listing-layout {
            grid-template-columns: 1fr;
          }

          .filter-overlay.show {
            display: block;
          }

          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 320px;
            max-width: 85vw;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s;
            border-radius: 0;
            overflow-y: auto;
          }

          .sidebar.show {
            transform: translateX(0);
          }

          .sidebar-header {
            display: flex;
          }

          .close-btn {
            display: flex;
          }

          .filter-overlay {
            display: none;
          }

          .filter-overlay.show {
            display: block;
          }
        }

        @media (max-width: 768px) {
          .page-title {
            font-size: 1.5rem;
          }

          .sort-section {
            width: 100%;
            order: 3;
          }

          .sort-label {
            display: none;
          }

          .sort-select {
            width: 100%;
          }

          .products-grid.grid-view {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
          }

          .pagination {
            gap: 1rem;
            padding: 1.5rem 1rem;
          }

          .pagination-btn .btn-text {
            display: none;
          }

          .page-label {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .page-header {
            padding: 1rem 0;
          }

          .header-content {
            gap: 0.75rem;
          }

          .products-grid.grid-view {
            grid-template-columns: repeat(2, 1fr);
          }

          .pagination-info {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  )
}

export default ProductListing