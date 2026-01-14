import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Truck, ShieldCheck, RefreshCw, CreditCard, ArrowRight, Loader2 } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { productsApi } from '../services/products'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Static categories with enhanced styling data
  const categories = [
    { id: 'silk', name: 'Silk Sarees', image: '/silk.png', desc: 'Timeless Elegance' },
    { id: 'cotton', name: 'Cotton Sarees', image: '/cotton.png', desc: 'Everyday Comfort' },
    { id: 'banarasi', name: 'Banarasi', image: '/banarasi.png', desc: 'Royal Tradition' },
    { id: 'kanchipuram', name: 'Kanchipuram', image: '/kanchipuram.png', desc: 'South Indian Heritage' }
  ]

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true)
        const data = await productsApi.getFeaturedProducts(8)
        setFeaturedProducts(data.products || [])
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-stone-50 overflow-x-hidden">
      
      {/* Hero Section - Split Layout with Modern Typography */}
      <section className="relative w-full h-[90vh] flex flex-col md:flex-row">
        {/* Left: Text Content */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-8 md:p-16 z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl space-y-6"
          >
            <span className="text-rose-600 font-medium tracking-widest uppercase text-sm">New Collection 2026</span>
            <h1 className="text-5xl md:text-7xl font-serif text-slate-900 leading-tight">
              Drape Yourself in <span className="italic text-rose-700">Elegance</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-md">
              Discover our handpicked collection of authentic Indian sarees, blending centuries of tradition with modern aesthetics.
            </p>
            <div className="pt-4">
              <Link 
                to="/products" 
                className="group inline-flex items-center px-8 py-4 bg-slate-900 text-white rounded-full transition-all hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-200"
              >
                Shop Collection
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right: Image with Overlay */}
        <div className="w-full md:w-1/2 h-full relative">
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent z-10 md:hidden" />
          <img 
            src="/homepage.png" 
            alt="Beautiful Saree Collection" 
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* Categories Section - Masonry/Grid feel */}
      <section className="py-20 px-4 md:px-12 max-w-8xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif text-slate-900 mb-4">Curated by Category</h2>
          <div className="w-24 h-1 bg-rose-600 mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link to={`/products?category=${category.id}`} key={category.id} className="block group relative overflow-hidden rounded-2xl h-[400px]">
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/10 transition-colors z-10" />
              <img 
                src={category.image} 
                alt={category.name} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                <h3 className="text-2xl font-serif text-white mb-1 translate-y-2 group-hover:translate-y-0 transition-transform">{category.name}</h3>
                <p className="text-slate-200 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  {category.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-20 bg-white px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif text-slate-900">Trending Now</h2>
              <p className="text-slate-500 mt-2">Our most loved selections this season</p>
            </div>
            <Link to="/products" className="hidden md:flex items-center text-rose-600 hover:text-rose-800 font-medium transition-colors">
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
             // Skeleton Loader for Professional Feel
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="bg-slate-200 h-[350px] rounded-xl w-full"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {featuredProducts.map(product => (
                <motion.div key={product._id} variants={itemVariants}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          <div className="mt-12 text-center md:hidden">
            <Link to="/products" className="btn btn-secondary w-full">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Signals / Features Section - Glassmorphism */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Truck className="w-8 h-8 text-rose-600" />}
              title="Free Shipping"
              desc="On domestic orders above ₹999"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-rose-600" />}
              title="Quality Assured"
              desc="Hand-checked for perfection"
            />
            <FeatureCard 
              icon={<RefreshCw className="w-8 h-8 text-rose-600" />}
              title="Easy Returns"
              desc="Hassle-free 7-day exchange"
            />
            <FeatureCard 
              icon={<CreditCard className="w-8 h-8 text-rose-600" />}
              title="Secure Payment"
              desc="Encrypted payment gateways"
            />
          </div>
        </div>
      </section>

    </div>
  )
}

// Sub-component for cleaner code
const FeatureCard = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100">
    <div className="p-4 bg-rose-50 rounded-full mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-slate-500 text-sm">{desc}</p>
  </div>
)

export default Home