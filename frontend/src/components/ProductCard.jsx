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
      // Added active:scale-[0.98] for tactile mobile feel
      // Added h-full to ensure cards in a row are always equal height
      className="group block h-full bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300"
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
              w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110
              ${isSoldOut ? 'opacity-60 grayscale' : ''}
            `}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 text-xs uppercase tracking-widest font-medium">
            No Image
          </div>
        )}

        {/* --- Badges (Absolute Positioning) --- */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-2 z-10 items-start">
          
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
          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 shadow-sm border border-slate-100">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] font-bold text-slate-700 leading-none pt-0.5">
              {product.ratings.average.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* --- Details Section --- */}
      {/* Reduced padding on mobile (p-3) for space efficiency, larger (p-4) on desktop */}
      <div className="p-3 md:p-4 flex flex-col h-auto flex-grow bg-white">
        
        {/* Category */}
        <div className="mb-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-600 transition-colors">
            {product.category}
          </span>
        </div>

        {/* Title: Scaled text-base for mobile, text-lg for desktop */}
        <h3 className="font-serif text-base md:text-lg text-slate-900 leading-tight mb-2 line-clamp-2 group-hover:text-rose-700 transition-colors">
          {product.name}
        </h3>

        {/* Price Row - Pushed to bottom with mt-auto */}
        <div className="mt-auto flex items-baseline gap-2 pt-2 border-t border-slate-50">
          {product.discountedPrice ? (
            <>
              <span className="text-base md:text-lg font-bold text-slate-900">
                {formatPrice(product.discountedPrice)}
              </span>
              <span className="text-xs text-slate-400 line-through decoration-slate-300">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-base md:text-lg font-bold text-slate-900">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCard