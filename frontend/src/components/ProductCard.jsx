import { Link } from 'react-router-dom'
import { MdFavoriteBorder, MdShoppingCart } from 'react-icons/md'

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return `₹${price.toLocaleString('en-IN')}`
  }

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-link">
        {/* Product Image */}
        <div className="product-image">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              loading="lazy"
            />
          ) : (
            <div className="placeholder-image">No Image</div>
          )}

          {/* Badges */}
          <div className="product-badges">
            {product.featured && <span className="badge badge-featured">Featured</span>}
            {product.discountedPrice && (
              <span className="badge badge-sale">Sale</span>
            )}
            {product.stock <= 0 && <span className="badge badge-out-of-stock">Out of Stock</span>}
          </div>

          {/* Wishlist Button */}
          <button className="wishlist-btn">
            <MdFavoriteBorder size={20} />
          </button>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h3 className="product-name">{product.name}</h3>
          <p className="product-category">{product.category}</p>

          {/* Ratings */}
          {product.ratings && (
            <div className="product-ratings">
              <span className="rating-value">★ {product.ratings.average.toFixed(1)}</span>
              <span className="rating-count">({product.ratings.count})</span>
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
        </div>
      </Link>

      {/* Add to Cart Button */}
      <button
        className="btn btn-primary btn-add-cart"
        disabled={product.stock <= 0}
      >
        <MdShoppingCart size={18} />
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </div>
  )
}

export default ProductCard