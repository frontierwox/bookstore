import React, { useState, useEffect, useContext, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  MdShoppingCart, MdFavorite, MdFavoriteBorder, 
  MdLocalShipping, MdVerifiedUser, MdCached, 
  MdZoomIn, MdClose, MdCheckCircle, MdArrowForward, 
  MdStar, MdChevronRight 
} from 'react-icons/md'
import { motion, AnimatePresence } from 'framer-motion'
import { productsApi } from '../services/products'
import { cartApi } from '../services/cart'
import { CartContext } from '../context/CartContext'
import { AuthContext } from '../context/AuthContext'

// --- Helper: Toast Notification ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20, x: '-50%' }} 
      animate={{ opacity: 1, y: 0, x: '-50%' }} 
      exit={{ opacity: 0, y: -20, x: '-50%' }}
      className={`toast-notification ${type}`}
    >
      {type === 'success' ? <MdCheckCircle size={20} /> : <MdClose size={20} />}
      <span>{message}</span>
    </motion.div>
  )
}

// --- Main Component ---
const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { addToCart } = useContext(CartContext)
  const mobileGalleryRef = useRef(null)

  // Data State
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Interaction State
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [showImageZoom, setShowImageZoom] = useState(false)
  const [toast, setToast] = useState(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  // Fetch Data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true)
        window.scrollTo(0, 0)
        const data = await productsApi.getProductById(id)
        setProduct(data.product)
        
        // Set Defaults
        if (data.product.sizes?.length > 0) setSelectedSize(data.product.sizes[0])
        if (data.product.colors?.length > 0) setSelectedColor(data.product.colors[0])
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProductData()
  }, [id])

  // Handle Scroll on Mobile Gallery to update dots
  const handleMobileScroll = () => {
    if (mobileGalleryRef.current) {
      const scrollLeft = mobileGalleryRef.current.scrollLeft
      const width = mobileGalleryRef.current.offsetWidth
      const index = Math.round(scrollLeft / width)
      setSelectedImage(index)
    }
  }

  // Add to Cart Logic
  const handleAddToCart = async () => {
    if (!user) return navigate('/login', { state: { from: `/product/${id}` } })
    if (product.stock <= 0) return

    setAddingToCart(true)
    try {
      // API Call (Simulated if needed, or real)
      if (cartApi && cartApi.addToCart) {
         await cartApi.addToCart({
          product: id,
          quantity,
          selectedSize,
          selectedColor
        })
      }

      // Context Update
      addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountedPrice || null,
        image: product.images[0]?.url,
        selectedSize,
        selectedColor
      }, quantity)

      setToast({ message: 'Added to cart successfully', type: 'success' })
    } catch (error) {
      setToast({ message: 'Could not add to cart', type: 'error' })
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  if (loading) return (
    <div className="loader-container">
      <div className="spinner"></div>
      <p>Loading your favorite item...</p>
    </div>
  )
  
  if (!product) return (
    <div className="error-container">
      <h2>Product Not Found</h2>
      <Link to="/" className="btn-primary">Back to Store</Link>
    </div>
  )

  const discountPercentage = product.discountedPrice 
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) 
    : 0

  return (
    <div className="product-page">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* --- Breadcrumbs --- */}
      <div className="container">
        <nav className="breadcrumbs">
          <Link to="/">Home</Link> <MdChevronRight />
          <Link to="/products">Collection</Link> <MdChevronRight />
          <span className="current">{product.name}</span>
        </nav>
      </div>

      <div className="container main-content">
        <div className="product-grid">
          
          {/* --- Left Column: Gallery --- */}
          <div className="gallery-section">
            
            {/* Desktop Gallery (Stacked/Grid) */}
            <div className="desktop-gallery">
              <div className="main-image-wrapper" onClick={() => setShowImageZoom(true)}>
                <img 
                  src={product.images[selectedImage]?.url} 
                  alt={product.name} 
                  className="main-image"
                />
                <button className="zoom-trigger" title="Zoom Image"><MdZoomIn size={22} /></button>
                {discountPercentage > 0 && <span className="discount-tag">-{discountPercentage}% OFF</span>}
              </div>
              
              {product.images.length > 1 && (
                <div className="thumbnails-scroll">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onMouseEnter={() => setSelectedImage(idx)}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img.url} alt={`View ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Gallery (Swipeable) */}
            <div className="mobile-gallery">
              <div 
                className="mobile-slider" 
                ref={mobileGalleryRef}
                onScroll={handleMobileScroll}
              >
                {product.images.map((img, idx) => (
                  <div key={idx} className="mobile-slide" onClick={() => setShowImageZoom(true)}>
                    <img src={img.url} alt={product.name} />
                  </div>
                ))}
              </div>
              {/* Mobile Dots */}
              {product.images.length > 1 && (
                <div className="mobile-dots">
                  {product.images.map((_, idx) => (
                    <span key={idx} className={`dot ${selectedImage === idx ? 'active' : ''}`} />
                  ))}
                </div>
              )}
              {discountPercentage > 0 && <span className="mobile-discount-tag">-{discountPercentage}%</span>}
            </div>
          </div>

          {/* --- Right Column: Info & Actions --- */}
          <div className="details-section">
            
            {/* Header */}
            <div className="product-header">
              <h1 className="title">{product.name}</h1>
              <p className="subtitle">{product.shortDescription || "Experience the perfect blend of tradition and modern elegance with this exquisite piece."}</p>
            </div>

            {/* Price */}
            <div className="price-box">
              <div className="price-row">
                <span className="final-price">{formatPrice(product.discountedPrice || product.price)}</span>
                {product.discountedPrice && (
                  <span className="mrp">{formatPrice(product.price)}</span>
                )}
              </div>
              <p className="tax-note">Inclusive of all taxes</p>
            </div>

            <div className="divider"></div>

            {/* Selectors */}
            <div className="selectors-container">
              {/* Size Selector */}
              {product.sizes?.length > 0 && (
                <div className="selector-group">
                  <div className="label-row">
                    <span className="label">Select Size</span>
                    {selectedSize && <span className="selected-value">{selectedSize}</span>}
                  </div>
                  <div className="options-grid">
                    {product.sizes.map(size => (
                      <button
                        key={size}
                        className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {product.colors?.length > 0 && (
                <div className="selector-group">
                  <div className="label-row">
                    <span className="label">Select Color</span>
                    {selectedColor && <span className="selected-value" style={{textTransform: 'capitalize'}}>{selectedColor}</span>}
                  </div>
                  <div className="colors-row">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        className={`color-dot ${selectedColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        title={color}
                      >
                        {selectedColor === color && <MdCheckCircle className="color-check" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions (Desktop) */}
            <div className="actions-desktop">
              {/* Quantity */}
              <div className="qty-wrapper">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span className="qty-val">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>+</button>
              </div>

              {/* Add To Cart */}
              <button 
                className="add-to-cart-btn" 
                onClick={handleAddToCart}
                disabled={product.stock <= 0 || addingToCart}
              >
                {product.stock <= 0 ? (
                  'Out of Stock'
                ) : addingToCart ? (
                  <span className="loading-dots">Adding...</span>
                ) : (
                  <>Add to Cart <MdArrowForward size={20}/></>
                )}
              </button>

              {/* Wishlist */}
              <button 
                className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
                onClick={() => setIsWishlisted(!isWishlisted)}
                title="Add to Wishlist"
              >
                {isWishlisted ? <MdFavorite /> : <MdFavoriteBorder />}
              </button>
            </div>

            {/* Stock Warning */}
            {product.stock < 10 && product.stock > 0 && (
              <p className="stock-warning">
                <span className="pulse-dot"></span> Only {product.stock} units left!
              </p>
            )}

            {/* Trust Badges */}
            <div className="trust-grid">
              <div className="trust-item">
                <div className="icon-box"><MdVerifiedUser size={20} /></div>
                <span>100% Authentic</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><MdLocalShipping size={20} /></div>
                <span>Free Shipping</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><MdCached size={20} /></div>
                <span>7 Days Return</span>
              </div>
            </div>

            <div className="divider"></div>

            {/* Tabs */}
            <div className="product-tabs">
              <div className="tabs-header">
                {['description', 'specifications'].map(tab => (
                  <button 
                    key={tab} 
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && <motion.div layoutId="underline" className="active-line" />}
                  </button>
                ))}
              </div>
              
              <div className="tab-body">
                <AnimatePresence mode="wait">
                  {activeTab === 'description' ? (
                    <motion.div 
                      key="desc"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="desc-content"
                    >
                      <p>{product.description}</p>
                      {product.highlights && (
                        <ul className="highlights-list">
                          {product.highlights.map((hl, i) => <li key={i}>{hl}</li>)}
                        </ul>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="specs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <table className="specs-table">
                        <tbody>
                          {Object.entries(product.specifications || {}).map(([key, val]) => (
                            <tr key={key}>
                              <td className="spec-key">{key}</td>
                              <td className="spec-val">{val.toString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- Sticky Mobile Footer --- */}
      <div className="mobile-footer">
        <div className="footer-info">
          <span className="price-label">Total for {quantity} item(s)</span>
          <span className="price-val">{formatPrice((product.discountedPrice || product.price) * quantity)}</span>
        </div>
        <div className="footer-actions">
          {/* Mobile Qty Popup could go here, for now simpler layout */}
          <button 
            className="mobile-cta" 
            onClick={handleAddToCart}
            disabled={product.stock <= 0 || addingToCart}
          >
            {product.stock <= 0 ? 'No Stock' : addingToCart ? '...' : 'Add to Cart'}
          </button>
        </div>
      </div>

      {/* --- Zoom Modal --- */}
      <AnimatePresence>
        {showImageZoom && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="zoom-modal" 
            onClick={() => setShowImageZoom(false)}
          >
            <button className="zoom-close"><MdClose size={28} /></button>
            <motion.img 
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={product.images[selectedImage]?.url} 
              alt="Zoomed" 
              onClick={e => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CSS STYLES --- */}
      <style>{`
        :root {
          --primary: #e11d48;
          --primary-hover: #be123c;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --bg-page: #ffffff;
          --border: #e2e8f0;
          --bg-subtle: #f8fafc;
        }

        .product-page {
          background-color: var(--bg-page);
          min-height: 100vh;
          padding-bottom: 90px;
          font-family: 'Inter', sans-serif;
          color: var(--text-main);
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Loader */
        .loader-container {
          height: 80vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; color: var(--text-muted);
        }
        .spinner {
          width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Error */
        .error-container { text-align: center; padding-top: 100px; }
        .btn-primary { display: inline-block; margin-top: 16px; padding: 10px 24px; background: var(--text-main); color: white; text-decoration: none; border-radius: 8px; }

        /* Breadcrumbs */
        .breadcrumbs {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; color: var(--text-muted);
          padding: 20px 0;
        }
        .breadcrumbs a { text-decoration: none; color: var(--text-muted); transition: color 0.2s; }
        .breadcrumbs a:hover { color: var(--primary); }
        .breadcrumbs .current { color: var(--text-main); font-weight: 500; }

        /* Grid Layout */
        .main-content { margin-top: 12px; }
        .product-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 64px;
          align-items: start;
        }

        /* === Gallery Styles === */
        .gallery-section { position: relative; }
        .desktop-gallery { position: sticky; top: 100px; display: grid; gap: 16px; }
        
        .main-image-wrapper {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: var(--bg-subtle);
          aspect-ratio: 4/5;
          cursor: zoom-in;
          border: 1px solid var(--border);
        }
        .main-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
        .main-image-wrapper:hover .main-image { transform: scale(1.05); }
        
        .discount-tag {
          position: absolute; top: 16px; left: 16px;
          background: var(--primary); color: white;
          font-size: 12px; font-weight: 700;
          padding: 6px 12px; border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        .zoom-trigger {
          position: absolute; bottom: 16px; right: 16px;
          background: white; border: none; border-radius: 50%;
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          color: var(--text-main); cursor: pointer;
          transition: all 0.2s; opacity: 0; transform: translateY(10px);
        }
        .main-image-wrapper:hover .zoom-trigger { opacity: 1; transform: translateY(0); }

        .thumbnails-scroll {
          display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px;
        }
        .thumbnail {
          width: 80px; height: 80px; border-radius: 10px;
          overflow: hidden; cursor: pointer;
          border: 2px solid transparent; opacity: 0.7; transition: all 0.2s;
          flex-shrink: 0; background: var(--bg-subtle);
        }
        .thumbnail.active { border-color: var(--primary); opacity: 1; transform: translateY(-2px); }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; }

        /* Mobile Gallery Hidden on Desktop */
        .mobile-gallery { display: none; }

        /* === Details Styles === */
        .details-section { padding-top: 10px; }
        .product-header .title {
          font-family: 'Playfair Display', serif;
          font-size: 36px; font-weight: 700;
          margin-bottom: 12px; line-height: 1.2; letter-spacing: -0.5px;
        }
        .rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .stars { display: flex; color: #fbbf24; font-size: 18px; }
        .reviews-count { font-size: 13px; color: var(--text-muted); font-weight: 500; }
        
        .subtitle { font-size: 16px; color: var(--text-muted); line-height: 1.6; margin-bottom: 24px; }

        .price-box { margin-bottom: 32px; }
        .price-row { display: flex; align-items: baseline; gap: 16px; }
        .final-price { font-size: 32px; font-weight: 700; color: var(--text-main); letter-spacing: -1px; }
        .mrp { font-size: 20px; text-decoration: line-through; color: var(--text-muted); font-weight: 400; }
        .tax-note { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

        .divider { height: 1px; background: var(--border); margin: 32px 0; }

        /* Selectors */
        .selectors-container { display: flex; flex-direction: column; gap: 28px; }
        .label-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; font-weight: 600; }
        .selected-value { color: var(--text-muted); font-weight: 400; }
        
        .options-grid { display: flex; flex-wrap: wrap; gap: 12px; }
        .size-btn {
          min-width: 54px; height: 44px; padding: 0 16px;
          background: white; border: 1px solid var(--border);
          border-radius: 8px; font-size: 14px; font-weight: 600;
          color: var(--text-main); cursor: pointer; transition: all 0.2s;
        }
        .size-btn:hover { border-color: var(--text-main); }
        .size-btn.selected { background: var(--text-main); color: white; border-color: var(--text-main); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

        .colors-row { display: flex; gap: 14px; }
        .color-dot {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid white; box-shadow: 0 0 0 1px var(--border);
          cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .color-dot:hover { transform: scale(1.1); }
        .color-dot.selected { box-shadow: 0 0 0 2px var(--text-main); }
        .color-check { color: white; font-size: 18px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }

        /* Desktop Actions */
        .actions-desktop { display: flex; gap: 16px; margin-top: 40px; height: 52px; }
        
        .qty-wrapper {
          display: flex; align-items: center;
          border: 1px solid var(--border); border-radius: 10px;
          background: white; overflow: hidden;
        }
        .qty-wrapper button {
          width: 44px; height: 100%; border: none; background: transparent;
          font-size: 20px; color: var(--text-muted); cursor: pointer; transition: background 0.2s;
        }
        .qty-wrapper button:hover { background: #f8fafc; color: var(--text-main); }
        .qty-val { width: 40px; text-align: center; font-weight: 600; font-size: 16px; }

        .add-to-cart-btn {
          flex: 1; background: var(--text-main); color: white;
          border: none; border-radius: 10px;
          font-size: 16px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.2s; box-shadow: 0 4px 12px rgba(15,23,42,0.15);
        }
        .add-to-cart-btn:hover { background: #1e293b; transform: translateY(-2px); }
        .add-to-cart-btn:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }

        .wishlist-btn {
          width: 52px; border: 1px solid var(--border); background: white;
          border-radius: 10px; display: flex; align-items: center; justify-content: center;
          font-size: 24px; color: var(--text-muted); cursor: pointer; transition: all 0.2s;
        }
        .wishlist-btn:hover { border-color: var(--primary); color: var(--primary); background: #fff1f2; }
        .wishlist-btn.active { color: var(--primary); border-color: var(--primary); background: #fff1f2; }

        .stock-warning { 
          font-size: 13px; color: #b91c1c; font-weight: 600; margin-top: 16px; 
          display: flex; align-items: center; gap: 8px;
        }
        .pulse-dot { width: 8px; height: 8px; background: #ef4444; border-radius: 50%; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 6px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }

        /* Trust Badges */
        .trust-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 20px; margin-top: 40px;
        }
        .trust-item {
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px;
        }
        .icon-box {
          width: 48px; height: 48px; background: #f1f5f9; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; color: var(--text-main);
        }
        .trust-item span { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }

        /* Tabs */
        .product-tabs { margin-top: 16px; }
        .tabs-header { display: flex; gap: 40px; border-bottom: 1px solid var(--border); margin-bottom: 24px; position: relative; }
        .tab-btn {
          background: none; border: none; padding: 16px 0;
          font-size: 15px; font-weight: 600; color: var(--text-muted);
          cursor: pointer; position: relative; transition: color 0.2s;
        }
        .tab-btn.active { color: var(--text-main); }
        .active-line {
          position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
          background: var(--text-main);
        }
        
        .tab-body { font-size: 15px; line-height: 1.8; color: var(--text-muted); min-height: 200px; }
        .highlights-list { padding-left: 20px; margin-top: 16px; }
        .specs-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .specs-table td { padding: 14px 0; border-bottom: 1px solid #f1f5f9; }
        .spec-key { color: var(--text-muted); width: 40%; }
        .spec-val { color: var(--text-main); font-weight: 500; }

        /* Toast */
        .toast-notification {
          position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
          background: #1e293b; color: white; padding: 12px 24px;
          border-radius: 50px; display: flex; align-items: center; gap: 12px;
          font-size: 14px; font-weight: 500; z-index: 2000;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
        }
        .toast-notification.error { background: #ef4444; }

        /* Mobile Footer (Hidden Desktop) */
        .mobile-footer { display: none; }

        /* Zoom Modal */
        .zoom-modal {
          position: fixed; inset: 0; background: rgba(255,255,255,0.98);
          z-index: 3000; display: flex; align-items: center; justify-content: center;
        }
        .zoom-modal img { max-width: 95%; max-height: 95vh; object-fit: contain; cursor: zoom-out; }
        .zoom-close {
          position: absolute; top: 24px; right: 24px; background: #f1f5f9;
          border: none; cursor: pointer; width: 48px; height: 48px; border-radius: 50%;
          color: var(--text-main); display: flex; align-items: center; justify-content: center;
        }

        /* --- RESPONSIVE DESIGN --- */
        @media (max-width: 1024px) {
          .product-grid { gap: 40px; }
          .title { font-size: 30px; }
        }

        @media (max-width: 900px) {
          .container { padding: 0 16px; }
          .product-grid { grid-template-columns: 1fr; gap: 32px; }
          
          /* Switch Gallery to Mobile Mode */
          .desktop-gallery { display: none; }
          .mobile-gallery { display: block; position: relative; margin: 0 -16px; /* Bleed to edge */ }
          
          .mobile-slider {
            display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
            scrollbar-width: none; /* Hide scrollbar */
          }
          .mobile-slider::-webkit-scrollbar { display: none; }
          
          .mobile-slide {
            flex: 0 0 100%; scroll-snap-align: center;
            aspect-ratio: 4/5; position: relative;
          }
          .mobile-slide img { width: 100%; height: 100%; object-fit: cover; }
          
          .mobile-dots {
            position: absolute; bottom: 16px; left: 0; right: 0;
            display: flex; justify-content: center; gap: 8px; pointer-events: none;
          }
          .dot {
            width: 8px; height: 8px; background: rgba(255,255,255,0.5); border-radius: 50%;
            transition: all 0.2s; backdrop-filter: blur(4px);
          }
          .dot.active { background: white; transform: scale(1.2); }
          
          .mobile-discount-tag {
            position: absolute; top: 16px; left: 16px;
            background: var(--primary); color: white;
            font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px;
          }

          /* Details adjustments */
          .details-section { padding: 0 16px 24px 16px; }
          .title { font-size: 26px; }
          .final-price { font-size: 28px; }
          
          /* Hide Desktop Actions */
          .actions-desktop { display: none; }
          
          /* Show Mobile Footer */
          .mobile-footer {
            display: flex; align-items: center; justify-content: space-between;
            position: fixed; bottom: 0; left: 0; right: 0;
            background: white; padding: 12px 20px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
            z-index: 100; border-top: 1px solid var(--border);
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
          .footer-info { display: flex; flex-direction: column; }
          .price-label { font-size: 11px; color: var(--text-muted); }
          .price-val { font-size: 18px; font-weight: 700; color: var(--text-main); }
          
          .mobile-cta {
            background: var(--text-main); color: white; border: none;
            padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;
          }
          
          .trust-grid { padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        }
      `}</style>
    </div>
  )
}

export default ProductDetails