import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { productsApi } from '../services/products'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories] = useState([
    { id: 'silk', name: 'Silk Sarees', image: '/images/silk.jpg' },
    { id: 'cotton', name: 'Cotton Sarees', image: '/images/cotton.jpg' },
    { id: 'banarasi', name: 'Banarasi', image: '/images/banarasi.jpg' },
    { id: 'kanchipuram', name: 'Kanchipuram', image: '/images/kanchipuram.jpg' }
  ])

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await productsApi.getFeaturedProducts(8)
        setFeaturedProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching featured products:', error)
      }
    }
    fetchFeatured()
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Beautiful Sarees</h1>
          <p>Explore our exquisite collection of traditional and modern sarees</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Shop Now
          </Link>
        </div>
        <div className="hero-image">
          <img src="/images/hero.jpg" alt="Beautiful Saree Collection" />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2>Shop by Category</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="category-card"
            >
              <img src={category.image} alt={category.name} />
              <div className="category-overlay">
                <h3>{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section">
        <h2>Featured Sarees</h2>
        <div className="products-grid">
          {featuredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
        <div className="text-center">
          <Link to="/products" className="btn btn-secondary">
            View All Products
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🚚</div>
          <h3>Free Shipping</h3>
          <p>On orders above ₹999</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💎</div>
          <h3>Quality Assured</h3>
          <p>100% authentic products</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔄</div>
          <h3>Easy Returns</h3>
          <p>7-day return policy</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💳</div>
          <h3>Secure Payment</h3>
          <p>Safe and secure checkout</p>
        </div>
      </section>
    </div>
  )
}

export default Home
