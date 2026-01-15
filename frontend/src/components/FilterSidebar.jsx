import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Filter, RotateCcw, Check, Minus } from 'lucide-react'

const FilterSidebar = ({ 
  filters, 
  onFilterChange, 
  onToggleArray, 
  className = "" 
}) => {
  
  // Accordion States
  const [sections, setSections] = useState({
    sort: true,
    price: true, // Opened by default for visibility
    category: true,
    color: true,
    rating: false
  })

  const toggleSection = (section) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  // --- Data Constants ---
  const categories = [
    'Silk', 'Cotton', 'Banarasi', 'Kanchipuram', 
    'Georgette', 'Chiffon', 'Crepe', 'Linen', 'Bridal', 'Party Wear'
  ]
  
  const colors = [
    { name: 'Red', hex: '#ef4444' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Yellow', hex: '#eab308' },
    { name: 'Green', hex: '#22c55e' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Black', hex: '#171717' },
    { name: 'White', hex: '#ffffff', border: true },
    { name: 'Gold', hex: '#d4af37' },
    { name: 'Silver', hex: '#94a3b8' },
    { name: 'Beige', hex: '#f5f5dc', border: true },
  ]

  // Predefined Price Ranges
  const priceRanges = [
    { label: 'Under ₹2,000', min: 0, max: 2000 },
    { label: '₹2,000 - ₹4,000', min: 2000, max: 4000 },
    { label: '₹4,000 - ₹7,000', min: 4000, max: 7000 },
    { label: '₹7,000 - ₹10,000', min: 7000, max: 10000 },
    { label: 'Above ₹10,000', min: 10000, max: '' }, // empty string for no upper limit
  ]

  // --- Handlers ---

  const handleCategoryChange = (category) => {
    if (filters.category === category) {
      onFilterChange('category', '') 
    } else {
      onFilterChange('category', category)
    }
  }

  // Handle Price Range Selection (Acts like a Radio)
  const handlePriceRangeSelect = (min, max) => {
    // If clicking the currently active range, clear it
    if (filters.minPrice == min && filters.maxPrice == max) {
      onFilterChange('minPrice', '')
      onFilterChange('maxPrice', '')
    } else {
      onFilterChange('minPrice', min)
      onFilterChange('maxPrice', max)
    }
  }

  const handleReset = () => {
    onFilterChange('category', '')
    onFilterChange('minPrice', '')
    onFilterChange('maxPrice', '')
    onFilterChange('colors', [])
    onFilterChange('inStock', false)
    onFilterChange('sortBy', 'newest')
  }

  return (
    <aside className={`w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-serif text-lg text-slate-900 flex items-center gap-2 font-bold">
          <Filter size={18} className="text-rose-600" /> Filters
        </h3>
        <button 
          onClick={handleReset} 
          className="text-xs font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors uppercase tracking-wide"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        
        {/* 1. Sort By */}
        <FilterSection title="Sort By" isOpen={sections.sort} onToggle={() => toggleSection('sort')}>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none cursor-pointer transition-all"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="popular">Best Selling</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </FilterSection>

        {/* 2. Price Range (Ranges + Manual) */}
        <FilterSection title="Price" isOpen={sections.price} onToggle={() => toggleSection('price')}>
          <div className="space-y-3">
            
            {/* Checkbox Ranges */}
            <div className="space-y-1 mb-4">
              {priceRanges.map((range, idx) => {
                // Check if this range is currently active in the manual inputs
                const isActive = Number(filters.minPrice) === range.min && (range.max === '' ? filters.maxPrice === '' : Number(filters.maxPrice) === range.max);
                
                return (
                  <label 
                    key={idx} 
                    className={`flex items-center cursor-pointer px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-rose-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox" // UI looks like checkbox, logic acts like radio
                        checked={isActive}
                        onChange={() => handlePriceRangeSelect(range.min, range.max)}
                        className="peer w-4 h-4 border-2 border-slate-300 rounded transition-colors checked:bg-rose-600 checked:border-rose-600 appearance-none cursor-pointer"
                      />
                      <Check size={10} className="absolute left-[3px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className={`ml-3 text-sm ${isActive ? 'text-rose-700 font-medium' : 'text-slate-600'}`}>
                      {range.label}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Manual Inputs */}
            <div className="pt-3 border-t border-slate-50">
              <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">Custom Range</p>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => onFilterChange('minPrice', e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all"
                  />
                </div>
                <Minus size={12} className="text-slate-400" />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </FilterSection>

        {/* 3. Categories */}
        <FilterSection title="Category" isOpen={sections.category} onToggle={() => toggleSection('category')}>
          <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {categories.map(category => {
              const isSelected = filters.category === category
              return (
                <label 
                  key={category} 
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all group ${isSelected ? 'bg-rose-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryChange(category)}
                      className="peer hidden"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors mr-3 ${isSelected ? 'bg-rose-600 border-rose-600' : 'border-slate-300 group-hover:border-rose-400'}`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={4} />}
                    </div>
                    <span className={`text-sm ${isSelected ? 'text-rose-700 font-medium' : 'text-slate-600 group-hover:text-slate-900'}`}>
                      {category}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>
        </FilterSection>

        {/* 4. Colors */}
        <FilterSection title="Colors" isOpen={sections.color} onToggle={() => toggleSection('color')}>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const isSelected = filters.colors?.includes(color.name)
              return (
                <button
                  key={color.name}
                  onClick={() => onToggleArray('colors', color.name)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 relative
                    ${isSelected ? 'ring-2 ring-rose-600 ring-offset-2 scale-110' : 'hover:scale-110 hover:shadow-sm'}
                    ${color.border ? 'border border-slate-200' : ''}
                  `}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                  aria-label={isSelected ? `Deselect ${color.name}` : `Select ${color.name}`}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check 
                        size={14} 
                        className={color.name === 'White' || color.name === 'Beige' ? 'text-slate-900' : 'text-white'} 
                        strokeWidth={3} 
                      />
                    </motion.div>
                  )}
                </button>
              )
            })}
          </div>
        </FilterSection>

        {/* 5. Availability Switch */}
        <div className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
          <span className="text-sm font-medium text-slate-700">In Stock Only</span>
          <button
            onClick={() => onFilterChange('inStock', !filters.inStock)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
              ${filters.inStock ? 'bg-rose-600' : 'bg-slate-200'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${filters.inStock ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </button>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </aside>
  )
}

// --- Helper Component ---
const FilterSection = ({ title, isOpen, onToggle, children }) => {
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-slate-50 transition-colors group focus:outline-none"
      >
        <span className="font-semibold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
          {title}
        </span>
        <div className="text-slate-400 group-hover:text-rose-600 transition-colors">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FilterSidebar