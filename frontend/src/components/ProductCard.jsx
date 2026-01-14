import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Star } from 'lucide-react'

const ProductCard = ({ product }) => {
  
  // Format Price to Indian Rupee
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price)
  }

  // Calculate discount percentage
  const discountPercentage = product.discountedPrice 
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) 
    : 0

  const handleAddToCart = (e) => {
    e.preventDefault() // Prevent navigation to product page
    // Trigger your add to cart logic/context here
    console.log('Add to cart:', product._id)
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    // Trigger wishlist logic
    console.log('Toggle wishlist:', product._id)
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      {/* Main Link Wrapper */}
      <Link to={`/products/${product._id}`} className="block h-full flex flex-col">
        
        {/* Image Section */}
        <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              loading="lazy"
              className="w-full h-full object-cover object-top transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 text-sm">
              No Image
            </div>
          )}

          {/* Badges (Top Left) */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.stock <= 0 ? (
              <span className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
                Sold Out
              </span>
            ) : (
              <>
                {product.featured && (
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm backdrop-blur-md bg-opacity-90">
                    Featured
                  </span>
                )}
                {product.discountedPrice && (
                  <span className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm shadow-sm">
                    -{discountPercentage}%
                  </span>
                )}
              </>
            )}
          </div>

          {/* Wishlist Button (Top Right) */}
          <button 
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white transition-all z-20 hover:scale-110 active:scale-95"
            aria-label="Add to wishlist"
          >
            <Heart size={18} />
          </button>

          {/* Desktop Overlay: Add to Cart (Slides up on hover) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block z-20 bg-gradient-to-t from-black/40 to-transparent">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-white text-slate-900 font-medium py-3 rounded-xl shadow-lg hover:bg-rose-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              <ShoppingBag size={18} /> 
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="p-4 flex flex-col flex-grow">
          
          {/* Category & Rating Row */}
          <div className="flex justify-between items-start mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {product.category}
            </span>
            {product.ratings && product.ratings.count > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-amber-700 text-[10px] font-bold">
                <Star size={10} fill="currentColor" /> 
                {product.ratings.average.toFixed(1)}
                <span className="text-amber-400 font-normal ml-0.5">({product.ratings.count})</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif text-[17px] text-slate-900 leading-snug mb-2 group-hover:text-rose-600 transition-colors line-clamp-2 min-h-[2.75em]">
            {product.name}
          </h3>

          {/* Price Row */}
          <div className="mt-auto flex items-baseline gap-2.5">
            {product.discountedPrice ? (
              <>
                <span className="text-lg font-bold text-slate-900">
                  {formatPrice(product.discountedPrice)}
                </span>
                <span className="text-xs text-slate-400 line-through decoration-slate-300">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-slate-900">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Mobile Only: Add to Cart (Always visible below content) */}
      <div className="md:hidden px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0}
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium py-2.5 rounded-lg active:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <ShoppingBag size={16} /> 
          {product.stock > 0 ? 'Add' : 'Sold Out'}
        </button>
      </div>

    </div>
  )
}

export default ProductCard