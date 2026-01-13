import { useState, useEffect, useContext } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MdShoppingCart, MdHeart, MdHeartOutline } from 'react-icons/md'
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

      alert('Product added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add product to cart')
    } finally {
      setAddingToCart(false)
    }
  }

  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="error-page">
        <h2>Product not found</h2>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="product-details-page">
      <div className="product-details-container">
        {/* Product Images */}
        <div className="product-gallery">
          <div className="main-image">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImage]?.url}
                alt={product.images[selectedImage]?.alt || product.name}
              />
            ) : (
              <div className="placeholder-image">No Image</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.alt || `${product.name} ${index + 1}`}
                  className={selectedImage === index ? 'active' : ''}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>

          {/* Ratings */}
          {product.ratings && (
            <div className="product-ratings">
              <span className="rating-value">★ {product.ratings.average.toFixed(1)}</span>
              <span className="rating-count">({product.ratings.count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="product-price">
            {product.discountedPrice ? (
              <>
                <span className="price-original">{formatPrice(product.price)}</span>
                <span className="price-discounted">{formatPrice(product.discountedPrice)}</span>
                <span className="discount-percent">
                  {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="price-current">{formatPrice(product.price)}</span>
            )}
          </div>

          {/* Stock Status */}
          <div className="stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">In Stock ({product.stock} available)</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>

          {/* Description */}
          <div className="product-description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          {/* Specifications */}
          {product.specifications && (
            <div className="product-specifications">
              <h3>Specifications</h3>
              <ul>
                {product.specifications.fabric && <li>Fabric: {product.specifications.fabric}</li>}
                {product.specifications.length && <li>Length: {product.specifications.length}</li>}
                {product.specifications.work && <li>Work: {product.specifications.work}</li>}
                <li>Blouse Piece: {product.specifications.blousePiece ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="size-selector">
              <h3>Size</h3>
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
            <div className="color-selector">
              <h3>Color</h3>
              <div className="color-options">
                {product.colors.map(color => (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  >
                    {selectedColor === color && '✓'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="quantity-selector">
            <h3>Quantity</h3>
            <div className="quantity-controls">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max={product.stock}
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="product-actions">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || addingToCart}
              className="btn btn-primary btn-lg btn-block"
            >
              <MdShoppingCart size={20} />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="btn btn-outline btn-lg"
            >
              {isWishlisted ? <MdHeart size={20} /> : <MdHeartOutline size={20} />}
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetails
