import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Filter, RotateCcw, Check, Star } from 'lucide-react'

const FilterSidebar = ({ onFilterChange, className = "" }) => {
  // Enhanced State for multiple selections
  const [filters, setFilters] = useState({
    categories: [],
    minPrice: '',
    maxPrice: '',
    colors: [],
    occasions: [],
    minRating: 0,
    inStock: false,
    sortBy: 'newest'
  })

  // Accordion States (Open/Closed)
  const [sections, setSections] = useState({
    sort: true,
    price: true,
    category: true,
    color: true,
    occasion: false,
    rating: false
  })

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // --- Data Constants ---
  const categories = ['Silk', 'Cotton', 'Banarasi', 'Kanchipuram', 'Georgette', 'Chiffon', 'Crepe', 'Linen']
  
  const occasions = ['Wedding', 'Party Wear', 'Casual', 'Festive', 'Bridal', 'Office']
  
  const colors = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Black', hex: '#171717' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Gold', hex: '#d4af37' },
    { name: 'Silver', hex: '#c0c0c0' },
  ]

  // --- Handlers ---

  // Handle updates and bubble up to parent
  const updateFilters = (newFilters) => {
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleCheckboxChange = (group, value) => {
    const current = filters[group]
    const updated = current.includes(value)
      ? current.filter(item => item !== value) // Remove
      : [...current, value] // Add
    
    updateFilters({ ...filters, [group]: updated })
  }

  const handlePriceChange = (e) => {
    updateFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleReset = () => {
    const resetState = {
      categories: [],
      minPrice: '',
      maxPrice: '',
      colors: [],
      occasions: [],
      minRating: 0,
      inStock: false,
      sortBy: 'newest'
    }
    updateFilters(resetState)
  }

  return (
    <aside className={`w-full bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-serif text-lg text-slate-900 flex items-center gap-2">
          <Filter size={18} className="text-rose-600" /> Filters
        </h3>
        <button 
          onClick={handleReset} 
          className="text-xs font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        
        {/* 1. Sort By Section */}
        <FilterSection title="Sort By" isOpen={sections.sort} onToggle={() => toggleSection('sort')}>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilters({ ...filters, sortBy: e.target.value })}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none cursor-pointer"
          >
            <option value="newest">New Arrivals</option>
            <option value="popularity">Best Selling</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </FilterSection>

        {/* 2. Price Range */}
        <FilterSection title="Price Range" isOpen={sections.price} onToggle={() => toggleSection('price')}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice}
                onChange={handlePriceChange}
                className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none"
              />
            </div>
            <span className="text-slate-400">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">₹</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={handlePriceChange}
                className="w-full pl-6 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none"
              />
            </div>
          </div>
        </FilterSection>

        {/* 3. Categories (Checkbox List) */}
        <FilterSection title="Fabric & Category" isOpen={sections.category} onToggle={() => toggleSection('category')}>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {categories.map(category => (
              <label key={category} className="flex items-center group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCheckboxChange('categories', category)}
                    className="peer w-4 h-4 border-2 border-slate-300 rounded transition-colors checked:bg-rose-600 checked:border-rose-600 cursor-pointer appearance-none"
                  />
                  <Check size={10} className="absolute left-[3px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="ml-3 text-sm text-slate-600 group-hover:text-rose-600 transition-colors">
                  {category}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* 4. Colors (Visual Swatches) */}
        <FilterSection title="Colors" isOpen={sections.color} onToggle={() => toggleSection('color')}>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isSelected = filters.colors.includes(color.name)
              return (
                <button
                  key={color.name}
                  onClick={() => handleCheckboxChange('colors', color.name)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-rose-500 ring-offset-2 scale-110' : 'hover:scale-110'
                  } ${color.border ? 'border border-slate-200' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {isSelected && (
                    <Check size={14} className={color.name === 'White' ? 'text-slate-900' : 'text-white'} strokeWidth={3} />
                  )}
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* 5. Occasion */}
        <FilterSection title="Occasion" isOpen={sections.occasion} onToggle={() => toggleSection('occasion')}>
          <div className="space-y-2">
            {occasions.map(occ => (
              <label key={occ} className="flex items-center group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.occasions.includes(occ)}
                    onChange={() => handleCheckboxChange('occasions', occ)}
                    className="peer w-4 h-4 border-2 border-slate-300 rounded transition-colors checked:bg-rose-600 checked:border-rose-600 cursor-pointer appearance-none"
                  />
                  <Check size={10} className="absolute left-[3px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                </div>
                <span className="ml-3 text-sm text-slate-600 group-hover:text-rose-600 transition-colors">
                  {occ}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* 6. Rating */}
        <FilterSection title="Minimum Rating" isOpen={sections.rating} onToggle={() => toggleSection('rating')}>
          <div className="space-y-2">
            {[4, 3, 2].map((star) => (
              <label key={star} className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === star}
                  onChange={() => updateFilters({ ...filters, minRating: star })}
                  className="w-4 h-4 border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="ml-3 flex items-center gap-1 text-sm text-slate-600 group-hover:text-slate-900">
                  {star}<Star size={12} fill="currentColor" className="text-amber-400" /> & up
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* 7. Availability (Switch) */}
        <div className="p-5 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">In Stock Only</span>
          <button
            onClick={() => updateFilters({ ...filters, inStock: !filters.inStock })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              filters.inStock ? 'bg-rose-600' : 'bg-slate-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                filters.inStock ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>
    </aside>
  )
}

// Helper Component for Collapsible Sections
const FilterSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-slate-50 transition-colors group"
      >
        <span className="font-medium text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-slate-400 group-hover:text-rose-600" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 group-hover:text-rose-600" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FilterSidebar