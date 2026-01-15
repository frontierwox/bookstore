import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'

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

  const isSoldOut = product.stock <= 0

  return (
    <Link 
      to={`/products/${product._id}`}
      className="group block bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full"
    >
      {/* --- Image Section --- */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        
        {/* Product Image */}
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt || product.name}
            loading="lazy"
            className={`
              w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105
              ${isSoldOut ? 'opacity-60 grayscale' : ''}
            `}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 text-xs uppercase tracking-widest font-medium">
            No Image
          </div>
        )}

        {/* --- Badges (Absolute Positioning) --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
          
          {/* Sold Out Badge */}
          {isSoldOut ? (
            <span className="bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
              Sold Out
            </span>
          ) : (
            <>
              {/* Discount Badge */}
              {product.discountedPrice && (
                <span className="bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">
                  -{discountPercentage}%
                </span>
              )}
              {/* Featured Badge */}
              {product.featured && (
                <span className="bg-amber-100/90 backdrop-blur-sm text-amber-800 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-amber-200/50">
                  Featured
                </span>
              )}
            </>
          )}
        </div>

        {/* Rating Badge (Bottom Left overlay) */}
        {product.ratings && product.ratings.count > 0 && (
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100/50">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold text-slate-700 leading-none pt-0.5">
              {product.ratings.average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* --- Details Section --- */}
      <div className="p-4 flex flex-col h-auto">
        
        {/* Category */}
        <div className="mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors">
            {product.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-[17px] text-slate-900 leading-[1.4] mb-2 line-clamp-2 group-hover:text-rose-700 transition-colors min-h-[2.8em]">
          {product.name}
        </h3>

        {/* Price Row */}
        <div className="mt-auto flex items-baseline gap-2.5 pt-2">
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
  )
}

export default ProductCard