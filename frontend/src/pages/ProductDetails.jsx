import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  MdShoppingCart, MdFavorite, MdFavoriteBorder, 
  MdLocalShipping, MdVerifiedUser, MdCached, 
  MdZoomIn, MdClose, MdCheckCircle, MdArrowForward 
} from 'react-icons/md'
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
    <div className={`toast-notification ${type}`}>
      {type === 'success' && <MdCheckCircle size={20} />}
      <span>{message}</span>
    </div>
  )
}

// --- Main Component ---
const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { addToCart } = useContext(CartContext)

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

  // Add to Cart Logic
  const handleAddToCart = async () => {
    if (!user) return navigate('/login', { state: { from: `/product/${id}` } })
    if (product.stock <= 0) return

    setAddingToCart(true)
    try {
      await cartApi.addToCart({
        product: id,
        quantity,
        selectedSize,
        selectedColor
      })

      addToCart({
        _id: product._id,
        name: product.name,
        price: product.price,
        discountPrice: product.discountedPrice || null,
        image: product.images[0]?.url
      }, quantity)

      setToast({ message: 'Added to cart', type: 'success' })
    } catch (error) {
      setToast({ message: 'Could not add to cart', type: 'error' })
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price)

  if (loading) return <div className="loader-container"><div className="spinner"></div></div>
  if (!product) return <div className="error-container"><h2>Product Not Found</h2><Link to="/" className="btn-primary">Go Home</Link></div>

  const discountPercentage = product.discountedPrice 
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) 
    : 0

  return (
    <div className="product-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container">
        {/* Breadcrumbs */}
        <nav className="breadcrumbs">
          <Link to="/">Home</Link> / <Link to="/products">Collection</Link> / <span className="current">{product.name}</span>
        </nav>

        <div className="product-grid">
          
          {/* --- Left Column: Gallery --- */}
          <div className="gallery-section">
            <div className="sticky-gallery">
              <div className="main-image-wrapper" onClick={() => setShowImageZoom(true)}>
                <img 
                  src={product.images[selectedImage]?.url} 
                  alt={product.name} 
                  className="main-image"
                />
                <button className="zoom-trigger"><MdZoomIn size={20} /></button>
                {discountPercentage > 0 && <span className="discount-tag">-{discountPercentage}%</span>}
              </div>
              
              {product.images.length > 1 && (
                <div className="thumbnails-grid">
                  {product.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onMouseEnter={() => setSelectedImage(idx)}
                      onClick={() => setSelectedImage(idx)}
                    >
                      <img src={img.url} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* --- Right Column: Info & Actions --- */}
          <div className="details-section">
            
            {/* Header */}
            <div className="product-header">
              <h1 className="title">{product.name}</h1>
              <p className="subtitle">{product.shortDescription || "Elegant design crafted for perfection."}</p>
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
                    <span className="label">Size</span>
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
                    <span className="label">Color</span>
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
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
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
                  'Adding...'
                ) : (
                  <>Add to Cart <MdArrowForward size={18}/></>
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

            {product.stock < 10 && product.stock > 0 && (
              <p className="stock-warning">Only {product.stock} units left in stock!</p>
            )}

            {/* Trust Badges (Static) */}
            <div className="trust-grid">
              <div className="trust-item">
                <div className="icon-box"><MdVerifiedUser size={20} /></div>
                <span>Authentic Quality</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><MdLocalShipping size={20} /></div>
                <span>Free Shipping</span>
              </div>
              <div className="trust-item">
                <div className="icon-box"><MdCached size={20} /></div>
                <span>Easy Returns</span>
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
                  </button>
                ))}
              </div>
              
              <div className="tab-body">
                {activeTab === 'description' && (
                  <div className="desc-content">
                    <p>{product.description}</p>
                    {product.highlights && (
                      <ul className="highlights-list">
                        {product.highlights.map((hl, i) => <li key={i}>{hl}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === 'specifications' && (
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
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Mobile Footer */}
      <div className="mobile-footer">
        <div className="footer-info">
          <span className="price-label">Total Price</span>
          <span className="price-val">{formatPrice(product.discountedPrice || product.price)}</span>
        </div>
        <button 
          className="mobile-cta" 
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
        >
          {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>

      {/* Zoom Modal */}
      {showImageZoom && (
        <div className="zoom-modal" onClick={() => setShowImageZoom(false)}>
          <button className="zoom-close"><MdClose size={24} /></button>
          <img src={product.images[selectedImage]?.url} alt="" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Styles */}
      <style>{`
        :root {
          --primary: #e11d48;
          --primary-hover: #be123c;
          --text-main: #0f172a;
          --text-muted: #64748b;
          --bg-page: #f8fafc;
          --border: #e2e8f0;
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
          padding: 24px;
        }

        /* Breadcrumbs */
        .breadcrumbs {
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
        .breadcrumbs a { text-decoration: none; color: var(--text-muted); transition: color 0.2s; }
        .breadcrumbs a:hover { color: var(--primary); }
        .breadcrumbs .current { color: var(--text-main); font-weight: 500; }

        /* Grid */
        .product-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }

        /* Gallery */
        .gallery-section { position: relative; }
        .sticky-gallery { position: sticky; top: 100px; }
        
        .main-image-wrapper {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          aspect-ratio: 3/4;
          cursor: zoom-in;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          border: 1px solid var(--border);
        }
        .main-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .main-image-wrapper:hover .main-image { transform: scale(1.05); }
        
        .discount-tag {
          position: absolute;
          top: 16px; left: 16px;
          background: var(--primary);
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 20px;
        }
        .zoom-trigger {
          position: absolute;
          bottom: 16px; right: 16px;
          background: white;
          border: none;
          border-radius: 50%;
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          color: var(--text-main);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .zoom-trigger:hover { transform: scale(1.1); }

        .thumbnails-grid {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .thumbnail {
          width: 70px; height: 70px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          opacity: 0.6;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .thumbnail.active { border-color: var(--primary); opacity: 1; }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; }

        /* Details */
        .product-header .title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .subtitle { font-size: 16px; color: var(--text-muted); line-height: 1.5; }

        .price-box { margin-top: 24px; }
        .price-row { display: flex; align-items: baseline; gap: 12px; }
        .final-price { font-size: 28px; font-weight: 700; color: var(--text-main); }
        .mrp { font-size: 18px; text-decoration: line-through; color: var(--text-muted); }
        .tax-note { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

        .divider { height: 1px; background: var(--border); margin: 32px 0; }

        /* Selectors */
        .selectors-container { display: flex; flex-direction: column; gap: 24px; }
        .label-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; font-weight: 600; }
        .selected-value { color: var(--text-muted); font-weight: 400; margin-left: 8px; }
        
        .options-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .size-btn {
          min-width: 48px; height: 40px;
          padding: 0 16px;
          background: white;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-main);
          cursor: pointer;
          transition: all 0.2s;
        }
        .size-btn:hover { border-color: var(--text-muted); }
        .size-btn.selected { background: var(--text-main); color: white; border-color: var(--text-main); }

        .colors-row { display: flex; gap: 12px; }
        .color-dot {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 0 1px var(--border);
          cursor: pointer;
          transition: all 0.2s;
        }
        .color-dot:hover { transform: scale(1.1); }
        .color-dot.selected { box-shadow: 0 0 0 2px var(--primary); }

        /* Actions */
        .actions-desktop { display: flex; gap: 16px; margin-top: 32px; height: 50px; }
        
        .qty-wrapper {
          display: flex; align-items: center;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }
        .qty-wrapper button {
          width: 40px; height: 100%;
          border: none; background: transparent;
          font-size: 18px; color: var(--text-muted);
          cursor: pointer;
          transition: background 0.2s;
        }
        .qty-wrapper button:hover { background: #f1f5f9; color: var(--text-main); }
        .qty-val { width: 40px; text-align: center; font-weight: 600; }

        .add-to-cart-btn {
          flex: 1;
          background: var(--text-main);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s;
        }
        .add-to-cart-btn:hover { background: #1e293b; }
        .add-to-cart-btn:disabled { background: #94a3b8; cursor: not-allowed; }

        .wishlist-btn {
          width: 50px;
          border: 1px solid var(--border);
          background: white;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .wishlist-btn:hover { border-color: var(--primary); color: var(--primary); }
        .wishlist-btn.active { color: var(--primary); border-color: var(--primary); background: #fff1f2; }

        .stock-warning { font-size: 13px; color: #dc2626; font-weight: 500; margin-top: 12px; }

        /* Trust Badges */
        .trust-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 16px; margin-top: 32px;
        }
        .trust-item {
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
        }
        .icon-box {
          width: 40px; height: 40px;
          background: #f1f5f9;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-main);
        }
        .trust-item span { font-size: 12px; font-weight: 500; color: var(--text-muted); }

        /* Tabs */
        .product-tabs { margin-top: 16px; }
        .tabs-header { display: flex; gap: 32px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
        .tab-btn {
          background: none; border: none;
          padding: 12px 0;
          font-size: 15px; font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn.active { color: var(--text-main); border-bottom-color: var(--text-main); }
        
        .tab-body { font-size: 15px; line-height: 1.7; color: var(--text-muted); }
        .highlights-list { padding-left: 20px; margin-top: 16px; }
        .specs-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .specs-table td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .spec-key { color: var(--text-muted); width: 40%; }
        .spec-val { color: var(--text-main); font-weight: 500; }

        /* Mobile Footer */
        .mobile-footer {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0;
          background: white;
          padding: 12px 24px;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
          z-index: 100;
          align-items: center; justify-content: space-between;
          border-top: 1px solid var(--border);
        }
        .price-label { font-size: 12px; color: var(--text-muted); display: block; }
        .price-val { font-size: 20px; font-weight: 700; color: var(--text-main); }
        .mobile-cta {
          background: var(--text-main);
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
        }

        /* Toast */
        .toast-notification {
          position: fixed; top: 90px; right: 24px;
          background: #1e293b; color: white;
          padding: 12px 20px; border-radius: 8px;
          display: flex; align-items: center; gap: 12px;
          font-size: 14px; font-weight: 500;
          z-index: 2000; animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
        .toast-notification.error { background: #ef4444; }
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        /* Zoom */
        .zoom-modal {
          position: fixed; inset: 0; background: rgba(255,255,255,0.98);
          z-index: 3000; display: flex; align-items: center; justify-content: center;
        }
        .zoom-modal img { max-width: 95%; max-height: 95vh; object-fit: contain; }
        .zoom-close {
          position: absolute; top: 24px; right: 24px;
          background: none; border: none; cursor: pointer;
          width: 48px; height: 48px; border-radius: 50%;
          background: #f1f5f9; color: var(--text-main);
          display: flex; align-items: center; justify-content: center;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .container { padding: 16px; }
          .product-grid { grid-template-columns: 1fr; gap: 32px; }
          .gallery-section { padding-bottom: 0; }
          .sticky-gallery { position: relative; top: 0; }
          .details-section { padding-bottom: 20px; }
          
          /* Hide Desktop Actions */
          .actions-desktop { display: none; }
          
          /* Show Mobile Footer */
          .mobile-footer { display: flex; }
          
          .trust-grid { margin-top: 0; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
          .title { font-size: 24px; }
        }
      `}</style>
    </div>
  )
}

export default ProductDetails