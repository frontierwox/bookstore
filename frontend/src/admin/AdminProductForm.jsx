import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Image as ImageIcon, 
  Tag, AlertCircle, CheckCircle, IndianRupee, Layers, 
  Percent, Calendar, Box, X, Ticket, ExternalLink, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/admin';
import { productsApi } from '../services/products';

// Import the Manager Component
import AdminCouponManager from './AdminCouponManager'; 

const categories = [
  { value: 'silk', label: 'Silk Saree' },
  { value: 'cotton', label: 'Cotton Saree' },
  { value: 'chiffon', label: 'Chiffon Saree' },
  { value: 'georgette', label: 'Georgette Saree' },
  { value: 'crepe', label: 'Crepe Saree' },
  { value: 'banarasi', label: 'Banarasi Silk' },
  { value: 'kanchipuram', label: 'Kanchipuram Silk' },
  { value: 'bridal', label: 'Bridal Collection' },
  { value: 'other', label: 'Other' }
];

const AdminProductForm = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Robust check: It's edit mode if 'mode' prop is 'edit' OR if an ID exists in the URL
  const isEdit = mode === 'edit' || Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  
  // --- Coupon Manager Modal State ---
  const [showCouponManager, setShowCouponManager] = useState(false);

  // --- Main Product Form State ---
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'silk',
    stock: 0,
    discountPercentage: 0,
    discountStartDate: '',
    discountEndDate: '',
    colors: [], 
    sizes: [],
    tags: [],
    imageUrl: '',
    imageAlt: ''
  });

  // Load Data for Edit Mode
  useEffect(() => {
    const load = async () => {
      // Only load if in edit mode and ID is present
      if (!isEdit || !id) {
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        const data = await productsApi.getProductById(id);
        const product = data.product;

        if (!product) throw new Error("Product not found");

        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price ?? '',
          category: product.category || 'silk',
          stock: product.stock ?? 0,
          discountPercentage: product.discountPercentage ?? 0,
          discountStartDate: product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '',
          discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '',
          colors: Array.isArray(product.colors) ? product.colors : [],
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          tags: Array.isArray(product.tags) ? product.tags : [],
          imageUrl: product.images?.[0]?.url || '',
          imageAlt: product.images?.[0]?.alt || ''
        });
      } catch (e) {
        console.error('Failed to load product', e);
        toast.error('Failed to load product details');
        navigate('/admin/products');
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [id, isEdit, navigate]);

  // Derived Values
  const numericPrice = Number(form.price) || 0;
  const numericDiscount = Number(form.discountPercentage) || 0;
  
  const finalPrice = useMemo(() => {
    const discountAmount = (numericPrice * numericDiscount) / 100;
    return Math.max(0, numericPrice - discountAmount);
  }, [numericPrice, numericDiscount]);

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // --- Array Item Handlers (Colors, Sizes, Tags) ---
  const handleAddItem = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (!value) return;

      if (!form[field].includes(value)) {
        setForm(prev => ({ ...prev, [field]: [...prev[field], value] }));
      }
      e.target.value = ''; // Clear input
    }
  };

  const handleRemoveItem = (field, indexToRemove) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter((_, index) => index !== indexToRemove)
    }));
  };

  // --- Handle Product Save ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.description || form.price === '' || !form.category) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }
    const discountedPrice =
      Number(form.discountPercentage) > 0
        ? Math.round(
            Number(form.price) -
            (Number(form.price) * Number(form.discountPercentage)) / 100
          )
        : null;

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      discountedPrice,
      category: form.category,
      stock: Number(form.stock),
      discountPercentage: Number(form.discountPercentage) || 0,
      discountStartDate: form.discountStartDate || null,
      discountEndDate: form.discountEndDate || null,
      colors: form.colors,
      sizes: form.sizes,
      tags: form.tags,
      images: form.imageUrl ? [{ url: form.imageUrl, alt: form.imageAlt || form.name }] : []
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminApi.updateProduct(id, payload);
        toast.success('Product updated successfully');
      } else {
        const res = await adminApi.createProduct(payload);
        toast.success('Product created successfully');
        
        // Check both common response structures
        const newId = res.product?._id || res.data?._id || res._id;
        
        if(newId) {
          navigate(`/admin/products/edit/${newId}`);
        } else {
          navigate('/admin/products');
        }
      }
    } catch (e) {
      console.error('Failed to save product', e);
      toast.error(e.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Loading ---
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 relative">
      
      {/* --- Full Screen Coupon Manager Overlay --- */}
      <AnimatePresence>
        {showCouponManager && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shadow-sm">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                   <Ticket size={20} className="text-rose-600"/> Coupon Manager
                </h2>
                <p className="text-xs text-slate-500">Create and manage discounts for your store</p>
              </div>
              <button 
                onClick={() => setShowCouponManager(false)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="pb-10">
               <AdminCouponManager />
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/products" className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-slate-900">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Manage product details, pricing and inventory.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/products" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
              Cancel
            </Link>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEdit ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN (Main Info) --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Layers size={20} className="text-slate-400" /> General Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                  <input 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                    placeholder="e.g. Kanjivaram Silk Saree"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-y"
                    placeholder="Detailed description of the product..."
                  />
                </div>
              </div>
            </div>

            {/* Media Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-slate-400" /> Media
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                    <input 
                      name="imageUrl" 
                      value={form.imageUrl} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-sm font-mono"
                      placeholder="https://..."
                    />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alt Text</label>
                    <input 
                      name="imageAlt" 
                      value={form.imageAlt} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      placeholder="Brief description of image"
                    />
                  </div>
                </div>

                {/* Image Preview Area */}
                <div className="mt-4 border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[160px]">
                  {form.imageUrl ? (
                    <div className="relative group">
                      <img 
                        src={form.imageUrl} 
                        alt="Preview" 
                        className="h-40 w-auto object-contain rounded-lg shadow-sm" 
                        onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Invalid+Image'; }}
                      />
                      <button 
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No image selected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory & Variants */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Box size={20} className="text-slate-400" /> Inventory & Variants
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select 
                      name="category" 
                      value={form.category} 
                      onChange={handleChange} 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all appearance-none"
                    >
                      {categories.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
                  <input 
                    name="stock" 
                    type="number"
                    min="0"
                    value={form.stock} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  />
                  {Number(form.stock) < 10 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Low stock warning
                    </p>
                  )}
                </div>
              </div>

              {/* COLORS INPUT: Visual bubbles */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Colors (Press Enter to add)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Palette size={16} /></span>
                    <input 
                      onKeyDown={(e) => handleAddItem(e, 'colors')}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      placeholder="e.g. Red, #ff0000, Navy"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2 pl-1 pr-2 py-1 bg-slate-100 rounded-full border border-slate-200 shadow-sm">
                         {/* Visual Color Bubble */}
                         <span 
                           className="w-5 h-5 rounded-full border border-slate-300 shadow-inner" 
                           style={{ backgroundColor: color }}
                         ></span>
                         <span className="text-xs font-medium text-slate-700 capitalize">{color}</span>
                         <button 
                           onClick={() => handleRemoveItem('colors', idx)}
                           className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                         >
                           <X size={14} />
                         </button>
                      </div>
                    ))}
                    {form.colors.length === 0 && <span className="text-xs text-slate-400 italic py-1">No colors added</span>}
                  </div>
                </div>

                {/* SIZES INPUT: Chips */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Sizes (Press Enter to add)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Tag size={16} /></span>
                    <input 
                      onKeyDown={(e) => handleAddItem(e, 'sizes')}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      placeholder="e.g. S, M, XL"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.sizes.map((size, idx) => (
                      <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-sm uppercase">
                        {size}
                        <button 
                          onClick={() => handleRemoveItem('sizes', idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {form.sizes.length === 0 && <span className="text-xs text-slate-400 italic py-1">No sizes added</span>}
                  </div>
                </div>

                {/* TAGS INPUT: Chips */}
                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tags (Press Enter to add)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Tag size={16} /></span>
                    <input 
                      onKeyDown={(e) => handleAddItem(e, 'tags')}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      placeholder="e.g. Wedding, Summer, Casual"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.tags.map((tag, idx) => (
                      <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                        {tag}
                        <button 
                          onClick={() => handleRemoveItem('tags', idx)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN (Pricing & Coupons) --- */}
          <div className="space-y-6">
            
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <IndianRupee size={20} className="text-slate-400" /> Pricing
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Base Price (₹) <span className="text-red-500">*</span></label>
                  <input 
                    name="price" 
                    type="number"
                    min="0"
                    value={form.price} 
                    onChange={handleChange} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-lg font-semibold"
                    placeholder="0.00"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-700">Discount</label>
                      <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">{form.discountPercentage || 0}% OFF</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400"><Percent size={16} /></span>
                    <input 
                      name="discountPercentage" 
                      type="number"
                      min="0"
                      max="100"
                      value={form.discountPercentage} 
                      onChange={handleChange} 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                   <label className="block text-sm font-medium text-slate-700">Duration (Optional)</label>
                   <div className="relative">
                     <span className="absolute left-3 top-3 text-slate-400"><Calendar size={16} /></span>
                     <input name="discountStartDate" type="date" value={form.discountStartDate} onChange={handleChange} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-2" />
                   </div>
                   <div className="relative">
                     <span className="absolute left-3 top-3 text-slate-400"><Calendar size={16} /></span>
                     <input name="discountEndDate" type="date" value={form.discountEndDate} onChange={handleChange} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                   </div>
                </div>
              </div>
            </div>

            {/* --- REPLACED: PROMOTIONS CARD LINKING TO MANAGER --- */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Ticket size={20} className="text-slate-400" /> Promotions
              </h3>
              
              <div className="space-y-4">
                {isEdit ? (
                  <>
                    <p className="text-sm text-slate-600">
                      Manage coupons and discount codes for this product or the entire store.
                    </p>
                    <button 
                      onClick={() => setShowCouponManager(true)}
                      className="w-full py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100"
                    >
                      <Ticket size={18} /> Open Coupon Manager
                    </button>
                    <div className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                      <ExternalLink size={12}/> Opens in overlay
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-600">Save Product First</p>
                    <p className="text-xs text-slate-400 mt-1">
                      You can create coupons after saving the product details.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="bg-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <IndianRupee size={100} />
              </div>
              <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4 relative z-10">Customer Price Preview</h4>
              
              <div className="space-y-1 relative z-10">
                <div className="text-3xl font-bold font-serif">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </div>
                {numericDiscount > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 line-through">₹{numericPrice.toLocaleString('en-IN')}</span>
                    <span className="text-rose-400 font-bold">Save ₹{(numericPrice - finalPrice).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400 relative z-10">
                <CheckCircle size={14} className="text-emerald-500" />
                <span>Price includes calculated tax estimate</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProductForm;