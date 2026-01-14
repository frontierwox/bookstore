import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MdShoppingCart, MdFavorite, MdFavoriteBorder, MdShare, MdStar, MdStarBorder, MdLocalShipping, MdVerifiedUser, MdCached, MdExpandMore, MdExpandLess, MdZoomIn, MdClose } from 'react-icons/md'
import { productsApi } from '../services/products'
import { cartApi } from '../services/cart'
import { CartContext } from '../context/CartContext'
import { AuthContext } from '../context/AuthContext'

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { addToCart } = useContext(CartContext)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productsApi.getProductById(id)
        setProduct(data.product)
        // Set default size and color
        if (data.product.sizes && data.product.sizes.length > 0) {
          setSelectedSize(data.product.sizes[0])
        }
        if (data.product.colors && data.product.colors.length > 0) {
          setSelectedColor(data.product.colors[0])
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setAddingToCart(true)
    try {
      await cartApi.addToCart({
        product: id,
        quantity,
        selectedSize,
        selectedColor
      })

      // Keep local cart badge in sync
      addToCart(
        {
          _id: product._id,
          name: product.name,
          price: product.price,
          discountPrice: product.discountedPrice || null
        },
        quantity
      )

      // Show success notification
      showNotification('Product added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      showNotification('Failed to add product to cart', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const showNotification = (message, type = 'success') => {
    // Simple notification - you can replace with toast library
    const notification = document.createElement('div')
    notification.className = `notification ${type}`
    notification.textContent = message
    document.body.appendChild(notification)
    setTimeout(() => notification.classList.add('show'), 100)
    setTimeout(() => {
      notification.classList.remove('show')
      setTimeout(() => notification.remove(), 300)
    }, 3000)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      setShowShareMenu(!showShareMenu)
    }
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="error-page">
        <div className="error-content">
          <h2>Product not found</h2>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="product-details-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <Link to="/">Home</Link>
        <span className="separator">/</span>
        <Link to="/products">Products</Link>
        <span className="separator">/</span>
        <span className="current">{product.name}</span>
      </nav>

      <div className="product-details-container">
        {/* Product Gallery */}
        <div className="product-gallery">
          <div className="main-image-container">
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[selectedImage]?.url}
                  alt={product.images[selectedImage]?.alt || product.name}
                  className="main-image"
                  onClick={() => setShowImageZoom(true)}
                />
                <button 
                  className="zoom-btn"
                  onClick={() => setShowImageZoom(true)}
                  aria-label="Zoom image"
                >
                  <MdZoomIn size={24} />
                </button>
                {product.discountedPrice && (
                  <span className="discount-badge">
                    {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                  </span>
                )}
              </>
            ) : (
              <div className="placeholder-image">No Image Available</div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || `${product.name} ${index + 1}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <div className="product-header">
            <div className="title-section">
              <h1 className="product-title">{product.name}</h1>
              <button 
                className="share-btn"
                onClick={handleShare}
                aria-label="Share product"
              >
                <MdShare size={20} />
              </button>
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    showNotification('Link copied to clipboard!')
                    setShowShareMenu(false)
                  }}>Copy Link</button>
                </div>
              )}
            </div>

            {/* Ratings */}
            {product.ratings && (
              <div className="product-ratings">
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    i < Math.round(product.ratings.average) 
                      ? <MdStar key={i} className="star filled" />
                      : <MdStarBorder key={i} className="star" />
                  ))}
                </div>
                <span className="rating-text">
                  {product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="price-section">
            {product.discountedPrice ? (
              <div className="price-group">
                <span className="price-current">{formatPrice(product.discountedPrice)}</span>
                <span className="price-original">{formatPrice(product.price)}</span>
                <span className="discount-tag">
                  {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                </span>
              </div>
            ) : (
              <span className="price-current">{formatPrice(product.price)}</span>
            )}
            <p className="tax-info">Inclusive of all taxes</p>
          </div>

          {/* Stock Status */}
          <div className={`stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            <span className="status-dot"></span>
            {product.stock > 0 ? (
              <span>In Stock - {product.stock} {product.stock === 1 ? 'piece' : 'pieces'} available</span>
            ) : (
              <span>Out of Stock</span>
            )}
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <div className="badge">
              <MdLocalShipping size={24} />
              <div className="badge-text">
                <strong>Free Delivery</strong>
                <span>On orders above ₹999</span>
              </div>
            </div>
            <div className="badge">
              <MdVerifiedUser size={24} />
              <div className="badge-text">
                <strong>Secure Payment</strong>
                <span>100% protected</span>
              </div>
            </div>
            <div className="badge">
              <MdCached size={24} />
              <div className="badge-text">
                <strong>Easy Returns</strong>
                <span>7-day return policy</span>
              </div>
            </div>
          </div>

          <div className="divider"></div>

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="option-selector">
              <label className="option-label">
                Select Size: <span className="selected-value">{selectedSize}</span>
              </label>
              <div className="size-options">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="option-selector">
              <label className="option-label">
                Select Color: <span className="selected-value">{selectedColor}</span>
              </label>
              <div className="color-options">
                {product.colors.map(color => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ 
                      backgroundColor: color,
                      border: selectedColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb'
                    }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    aria-label={`Select ${color} color`}
                  >
                    {selectedColor === color && (
                      <span className="check-mark">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div className="option-selector">
            <label className="option-label">Quantity</label>
            <div className="quantity-controls">
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                className="qty-input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                min="1"
                max={product.stock}
                aria-label="Quantity"
              />
              <button
                className="qty-btn"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="product-actions">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || addingToCart}
              className="btn btn-primary"
            >
              <MdShoppingCart size={20} />
              <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`btn btn-wishlist ${isWishlisted ? 'active' : ''}`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              {isWishlisted ? <MdFavorite size={24} /> : <MdFavoriteBorder size={24} />}
            </button>
          </div>

          <div className="divider"></div>

          {/* Description */}
          <div className="product-section">
            <h2 className="section-title">Product Description</h2>
            <div className={`description-content ${showFullDescription ? 'expanded' : ''}`}>
              <p>{product.description}</p>
            </div>
            {product.description && product.description.length > 200 && (
              <button 
                className="read-more-btn"
                onClick={() => setShowFullDescription(!showFullDescription)}
              >
                {showFullDescription ? (
                  <>Read Less <MdExpandLess /></>
                ) : (
                  <>Read More <MdExpandMore /></>
                )}
              </button>
            )}
          </div>

          {/* Specifications */}
          {product.specifications && (
            <div className="product-section">
              <h2 className="section-title">Specifications</h2>
              <div className="specifications-grid">
                {product.specifications.fabric && (
                  <div className="spec-item">
                    <span className="spec-label">Fabric</span>
                    <span className="spec-value">{product.specifications.fabric}</span>
                  </div>
                )}
                {product.specifications.length && (
                  <div className="spec-item">
                    <span className="spec-label">Length</span>
                    <span className="spec-value">{product.specifications.length}</span>
                  </div>
                )}
                {product.specifications.work && (
                  <div className="spec-item">
                    <span className="spec-label">Work</span>
                    <span className="spec-value">{product.specifications.work}</span>
                  </div>
                )}
                <div className="spec-item">
                  <span className="spec-label">Blouse Piece</span>
                  <span className="spec-value">
                    {product.specifications.blousePiece ? 'Included' : 'Not Included'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Zoom Modal */}
      {showImageZoom && product.images && (
        <div className="zoom-modal" onClick={() => setShowImageZoom(false)}>
          <button 
            className="close-zoom"
            onClick={() => setShowImageZoom(false)}
            aria-label="Close zoom"
          >
            <MdClose size={32} />
          </button>
          <img
            src={product.images[selectedImage]?.url}
            alt={product.images[selectedImage]?.alt || product.name}
            className="zoomed-image"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="zoom-thumbnails">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`zoom-thumb ${selectedImage === index ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedImage(index)
                }}
              >
                <img src={image.url} alt={`Thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .product-details-page {
          background: #f8f9fa;
          min-height: 100vh;
          padding: 1rem 0;
        }

        /* Breadcrumb */
        .breadcrumb {
          max-width: 1400px;
          margin: 0 auto 1.5rem;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .breadcrumb a {
          color: #6b7280;
          text-decoration: none;
          transition: color 0.2s;
        }

        .breadcrumb a:hover {
          color: #3b82f6;
        }

        .breadcrumb .separator {
          color: #d1d5db;
        }

        .breadcrumb .current {
          color: #111827;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }

        /* Container */
        .product-details-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 1rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3rem;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        /* Product Gallery */
        .product-gallery {
          position: sticky;
          top: 6rem;
          height: fit-content;
        }

        .main-image-container {
          position: relative;
          border-radius: 1rem;
          overflow: hidden;
          background: #f9fafb;
          aspect-ratio: 3/4;
          margin-bottom: 1rem;
        }

        .main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: zoom-in;
          transition: transform 0.3s;
        }

        .main-image:hover {
          transform: scale(1.05);
        }

        .zoom-btn {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          transition: all 0.2s;
        }

        .zoom-btn:hover {
          background: white;
          transform: scale(1.1);
        }

        .discount-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: #dc2626;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .placeholder-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          color: #6b7280;
          font-size: 1.125rem;
        }

        /* Thumbnail List */
        .thumbnail-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 0.75rem;
        }

        .thumbnail {
          aspect-ratio: 3/4;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          background: #f9fafb;
          padding: 0;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail:hover {
          border-color: #d1d5db;
        }

        .thumbnail.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        /* Product Info */
        .product-info {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .product-header {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .title-section {
          display: flex;
          align-items: start;
          justify-content: space-between;
          gap: 1rem;
          position: relative;
        }

        .product-title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          line-height: 1.3;
        }

        .share-btn {
          background: #f3f4f6;
          border: none;
          border-radius: 0.5rem;
          padding: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .share-btn:hover {
          background: #e5e7eb;
        }

        .share-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-top: 0.5rem;
          z-index: 10;
        }

        .share-menu button {
          display: block;
          width: 100%;
          padding: 0.75rem 1.25rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .share-menu button:hover {
          background: #f9fafb;
        }

        /* Ratings */
        .product-ratings {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .stars {
          display: flex;
          gap: 0.125rem;
        }

        .star {
          color: #d1d5db;
          width: 20px;
          height: 20px;
        }

        .star.filled {
          color: #fbbf24;
        }

        .rating-text {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Price Section */
        .price-section {
          background: #f9fafb;
          padding: 1.25rem;
          border-radius: 0.75rem;
        }

        .price-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .price-current {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
        }

        .price-original {
          font-size: 1.25rem;
          color: #9ca3af;
          text-decoration: line-through;
        }

        .discount-tag {
          background: #dcfce7;
          color: #166534;
          padding: 0.375rem 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .tax-info {
          margin: 0.5rem 0 0 0;
          font-size: 0.813rem;
          color: #6b7280;
        }

        /* Stock Status */
        .stock-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .stock-status.in-stock {
          color: #059669;
        }

        .stock-status.out-of-stock {
          color: #dc2626;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Trust Badges */
        .trust-badges {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          padding: 1.5rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }

        .badge {
          display: flex;
          gap: 0.75rem;
          align-items: start;
        }

        .badge svg {
          color: #3b82f6;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .badge-text {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .badge-text strong {
          font-size: 0.875rem;
          color: #111827;
        }

        .badge-text span {
          font-size: 0.75rem;
          color: #6b7280;
        }

        /* Divider */
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 0.5rem 0;
        }

        /* Option Selector */
        .option-selector {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .option-label {
          font-size: 0.938rem;
          font-weight: 600;
          color: #111827;
        }

        .selected-value {
          color: #3b82f6;
          font-weight: 400;
        }

        /* Size Options */
        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .size-btn {
          min-width: 3.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.938rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .size-btn:hover {
          border-color: #3b82f6;
        }

        .size-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        /* Color Options */
        .color-options {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .color-btn {
          width: 3rem;
          height: 3rem;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0;
        }

        .color-btn:hover {
          transform: scale(1.1);
        }

        .check-mark {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        /* Quantity Controls */
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: fit-content;
        }

        .qty-btn {
          width: 2.5rem;
          height: 2.5rem;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .qty-input {
          width: 4rem;
          height: 2.5rem;
          text-align: center;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 600;
        }

        .qty-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        /* Product Actions */
        .product-actions {
          display: grid;
          grid-template-columns: 1fr auto;
      }
          `}</style>
    </div>
  )
}

export default ProductDetails