import React, { useState, useEffect, useContext, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingBag, Search, Menu, X, User, LogOut, 
  Package, Heart, ChevronRight, Settings, Loader2 
} from 'lucide-react'
import { AuthContext } from '../context/AuthContext'
import { CartContext } from '../context/CartContext' // Assuming you have this

const Header = ({ appName = "Luxe Sarees" }) => {
  const { user, logout } = useContext(AuthContext)
  const { totalItems } = useContext(CartContext) || { totalItems: 0 }
  const navigate = useNavigate()
  const location = useLocation()
  
  // State
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const profileRef = useRef(null)

  // Scroll Detection for Glass Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsProfileOpen(false)
    setIsSearchOpen(false)
  }, [location])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
    }
  }

  // --- Animation Variants ---
  const mobileMenuVariants = {
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } }
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled || isMobileMenuOpen ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-10">
            
            {/* LEFT: Mobile Menu & Logo */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden text-slate-800 hover:text-rose-600 transition-colors"
              >
                <Menu size={24} />
              </button>

              <Link to="/" className="flex items-center gap-2 group">
                <span className={`font-serif text-2xl font-bold tracking-tight transition-colors ${
                  isScrolled ? 'text-slate-900' : 'text-slate-900 md:text-slate-800'
                }`}>
                  {appName}
                  <span className="text-rose-600">.</span>
                </span>
              </Link>
            </div>

            {/* CENTER: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/products">Shop Collection</NavLink>
              <NavLink to="/new-arrivals">New Arrivals</NavLink>
              <NavLink to="/about">Our Story</NavLink>
            </nav>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              
              {/* Search Toggle */}
              <div className="relative">
                 {/* Desktop Expanded Search */}
                 <form onSubmit={handleSearch} className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-rose-500/20 transition-all w-64">
                    <Search size={18} className="text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search sarees..."
                      className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 placeholder:text-slate-400"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </form>

                 {/* Mobile Search Icon */}
                 <button 
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="md:hidden p-2 text-slate-700 hover:text-rose-600 transition-colors"
                 >
                   <Search size={22} />
                 </button>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                {user ? (
                  <>
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="hidden md:flex items-center gap-2 p-1.5 pr-3 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-serif font-bold text-sm">
                        {user.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">
                        {user.name?.split(' ')[0]}
                      </span>
                    </button>
                    {/* Mobile User Icon */}
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)} 
                      className="md:hidden p-2 text-slate-700 hover:text-rose-600"
                    >
                      <User size={22} />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden"
                        >
                          <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                          </div>
                          <div className="py-1">
                            <DropdownItem to="/profile" icon={<Settings size={16} />} label="My Profile" />
                            <DropdownItem to="/orders" icon={<Package size={16} />} label="My Orders" />
                            <DropdownItem to="/wishlist" icon={<Heart size={16} />} label="Wishlist" />
                          </div>
                          <div className="border-t border-slate-50 pt-1">
                             <button 
                                onClick={logout}
                                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                             >
                               <LogOut size={16} className="mr-3" />
                               Sign Out
                             </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/login" className="hidden md:block text-sm font-medium text-slate-700 hover:text-rose-600">Login</Link>
                    <Link to="/register" className="text-sm font-medium px-4 py-2 bg-slate-900 text-white rounded-full hover:bg-rose-700 transition-colors shadow-sm">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>

              {/* Cart Icon */}
              <Link to="/cart" className="relative p-2 text-slate-700 hover:text-rose-600 transition-colors group">
                <ShoppingBag size={22} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 flex items-center justify-center bg-rose-600 text-white text-[10px] font-bold rounded-full ring-2 ring-white transform group-hover:scale-110 transition-transform">
                    {totalItems}
                  </span>
                )}
              </Link>

            </div>
          </div>

          {/* Mobile Search Bar (Expandable) */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden"
              >
                <form onSubmit={handleSearch} className="py-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search for sarees..."
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile Slide-Over Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 md:hidden"
            />
            
            {/* Drawer */}
            <motion.aside 
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white z-[60] shadow-2xl md:hidden overflow-y-auto"
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="font-serif text-2xl font-bold text-slate-900">{appName}</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-rose-600">
                    <X size={20} />
                  </button>
                </div>

                {/* Mobile Nav Links */}
                <nav className="space-y-1 flex-1">
                  <MobileNavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</MobileNavLink>
                  <MobileNavLink to="/products" onClick={() => setIsMobileMenuOpen(false)}>Shop Collection</MobileNavLink>
                  <MobileNavLink to="/categories" onClick={() => setIsMobileMenuOpen(false)}>Categories</MobileNavLink>
                  <MobileNavLink to="/about" onClick={() => setIsMobileMenuOpen(false)}>Our Story</MobileNavLink>
                  <MobileNavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</MobileNavLink>
                </nav>

                {/* Mobile Footer Area */}
                {user ? (
                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-serif font-bold">
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={logout} 
                      className="w-full py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut size={18} /> Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                     <Link to="/login" className="flex items-center justify-center py-3 rounded-xl border border-slate-200 font-medium text-slate-700">
                       Log In
                     </Link>
                     <Link to="/register" className="flex items-center justify-center py-3 rounded-xl bg-slate-900 text-white font-medium">
                       Register
                     </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// --- Sub Components ---

const NavLink = ({ to, children }) => {
  const location = useLocation()
  const isActive = location.pathname === to
  
  return (
    <Link 
      to={to} 
      className={`text-sm font-medium transition-colors relative group ${
        isActive ? 'text-rose-600' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
      <span className={`absolute -bottom-1 left-0 h-0.5 bg-rose-600 transition-all duration-300 ${
        isActive ? 'w-full' : 'w-0 group-hover:w-full'
      }`} />
    </Link>
  )
}

const MobileNavLink = ({ to, onClick, children }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
        isActive ? 'bg-rose-50 text-rose-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {children}
      {isActive && <ChevronRight size={16} />}
    </Link>
  )
}

const DropdownItem = ({ to, icon, label }) => (
  <Link 
    to={to} 
    className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors"
  >
    <span className="mr-3 text-slate-400">{icon}</span>
    {label}
  </Link>
)

export default Header