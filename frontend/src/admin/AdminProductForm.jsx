import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Save, Loader2, Image as ImageIcon, X, 
  Tag, IndianRupee, Layers, Percent, Box, Ticket, 
  UploadCloud, Plus, Trash2, ChevronRight, TrendingDown, 
  Truck, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/admin';
import { productsApi } from '../services/products';
import AdminCouponManager from './AdminCouponManager'; 

// --- INTERNAL COMPONENT: SUCCESS MODAL ---
const SuccessModal = ({ isOpen, onClose, onNavigate, message, isEdit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-600 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Success!</h2>
        <p className="text-slate-600 mb-6">{message}</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={onNavigate} 
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Go to Products List
          </button>
          {!isEdit && (
            <button 
              onClick={onClose} 
              className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Add Another Product
            </button>
          )}
          {isEdit && (
            <button 
              onClick={onClose} 
              className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
            >
              Keep Editing
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- INTERNAL COMPONENT: ENHANCED IMAGE UPLOADER ---
const ImageUploadArea = ({ images, onChange, maxImages = 25, maxSizeMB = 5, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFiles = useCallback((newFiles) => {
    const validFiles = [];
    if (images.length + newFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed.`);
      return;
    }
    newFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error(`Skipped ${file.name} (not an image).`);
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`Skipped ${file.name} (too large).`);
        return;
      }
      validFiles.push(file);
    });
    if (validFiles.length > 0) onChange([...images, ...validFiles]);
  }, [images, maxImages, maxSizeMB, onChange]);

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = (indexToRemove) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const getPreview = (item) => {
    if (item?.url) return item.url;
    if (item instanceof File) return URL.createObjectURL(item);
    return '/placeholder.png';
  };

  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img instanceof File || img instanceof Blob) {
          URL.revokeObjectURL(img);
        }
      });
    };
  }, [images]);

  return (
    <div className="w-full space-y-5">
      {images.length < maxImages && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed transition-all duration-300 ease-out 
            ${error ? 'border-red-400 bg-red-50' : 
             isDragging 
              ? 'border-rose-500 bg-rose-50 scale-[1.01]' 
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
            }`}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="flex flex-col items-center justify-center text-center px-4">
            <div className={`p-4 rounded-full mb-3 transition-colors duration-300 ${isDragging ? 'bg-rose-100 text-rose-600' : 'bg-white shadow-md text-slate-400 group-hover:text-rose-600 group-hover:scale-110'}`}>
              <UploadCloud size={28} />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              <span className="text-rose-600 hover:underline">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to {maxSizeMB}MB (Max {maxImages})</p>
          </div>
        </div>
      )}

      {error && (
         <div className="flex items-center gap-2 text-red-500 text-sm animate-pulse">
            <AlertCircle size={16} />
            <span>{error}</span>
         </div>
      )}

      <AnimatePresence mode='popLayout'>
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <motion.div
                layout
                key={image instanceof File ? `${image.name}-${index}` : image.url || index}
                initial={{ opacity: 0, scale: 0.8, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.5 }} 
                className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm group hover:shadow-md transition-shadow"
              >
                <img src={getPreview(image)} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); handleRemove(index); }} 
                  className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-slate-500 rounded-full shadow-sm hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 scale-90 hover:scale-100"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
            
            {images.length < maxImages && (
              <motion.div layout initial={{opacity:0}} animate={{opacity:1}} onClick={() => fileInputRef.current?.click()} className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 cursor-pointer flex flex-col items-center justify-center transition-all group">
                 <div className="p-2 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
                    <Plus size={20} className="text-slate-400 group-hover:text-slate-600" />
                 </div>
                 <span className="text-xs font-medium text-slate-500 mt-2">Add Image</span>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CONSTANTS ---
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

const PRESET_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Maroon', hex: '#800000' },
];

const AdminProductForm = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === 'edit' || Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [showCouponManager, setShowCouponManager] = useState(false);
  const [removedImageIds, setRemovedImageIds] = useState([]);
  
  // Success Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // UI Error State
  const [formErrors, setFormErrors] = useState({});

  const [newVariant, setNewVariant] = useState({ colorName: 'Red', hexCode: '#ef4444', stock: 10 });

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    wholesalePrice: '',
    retailShippingCost: '',
    retailTaxPercentage: '',
    wholesaleShippingCost: '',
    wholesaleTaxPercentage: '',
    category: 'silk',
    discountPercentage: 0,
    discountStartDate: '',
    discountEndDate: '',
    variants: [],
    sizes: [],
    tags: [],
    images: [],
    imageAlt: ''
  });

  const totalStock = useMemo(() => {
    return form.variants.reduce((acc, curr) => acc + Number(curr.stock), 0);
  }, [form.variants]);

  const marginAmount = useMemo(() => {
    const retail = Number(form.price) || 0;
    const wholesale = Number(form.wholesalePrice) || 0;
    return retail - wholesale;
  }, [form.price, form.wholesalePrice]);

  const marginPercent = useMemo(() => {
    const retail = Number(form.price) || 0;
    if (retail === 0) return 0;
    return Math.round((marginAmount / retail) * 100);
  }, [form.price, marginAmount]);


  // Load Data
  useEffect(() => {
    const load = async () => {
      if (!isEdit || !id) { setInitialLoading(false); return; }
      try {
        setInitialLoading(true);
        const data = await productsApi.getProductById(id);
        const product = data.product;
        if (!product) throw new Error("Product not found");

        setForm({
          name: product.name || '',
          description: product.description || '',
          price: product.price ?? '',
          wholesalePrice: product.wholesalePrice ?? '',
          retailShippingCost: product.retail?.shippingCost ?? '',
          retailTaxPercentage: product.retail?.taxPercentage ?? '',
          wholesaleShippingCost: product.wholesale?.shippingCost ?? '',
          wholesaleTaxPercentage: product.wholesale?.taxPercentage ?? '',
          category: product.category || 'silk',
          discountPercentage: product.discountPercentage ?? 0,
          discountStartDate: product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '',
          discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '',
          variants: product.variants || [],
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          tags: Array.isArray(product.tags) ? product.tags : [],
          images: product.images || [],
          imageAlt: product.images?.[0]?.alt || ''
        });
      } catch (e) {
        toast.error('Failed to load product details');
        navigate('/admin/products');
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field if it exists
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddItem = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (!value) return;
      if (!form[field].includes(value)) {
        setForm(prev => ({ ...prev, [field]: [...prev[field], value] }));
      }
      e.target.value = '';
    }
  };
  
  const handleRemoveItem = (field, indexToRemove) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, index) => index !== indexToRemove) }));
  };

  const handleAddVariant = () => {
    if (!newVariant.colorName || !newVariant.hexCode) {
      toast.error("Please select a color name and code");
      return;
    }
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { ...newVariant, stock: Number(newVariant.stock) }]
    }));
    setNewVariant(prev => ({ ...prev, stock: 10 })); 
    // Clear error if exists
    if (formErrors.variants) setFormErrors(prev => ({ ...prev, variants: null }));
  };

  const handleRemoveVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) throw new Error('Cloudinary upload failed');
    const data = await res.json();

    return { url: data.secure_url, publicId: data.public_id };
  };

  const validateForm = () => {
      const errors = {};
      if (!form.name.trim()) errors.name = "Product Name is required";
      if (!form.description.trim()) errors.description = "Description is required";
      if (!form.price || Number(form.price) <= 0) errors.price = "Valid price is required";
      if (!form.category) errors.category = "Category is required";
      if (form.images.length === 0) errors.images = "At least 1 image is required";
      if (form.variants.length === 0) errors.variants = "At least 1 color variant is required";

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        toast.error('Please fix the errors highlighting in red');
        return;
    }

    try {
      setLoading(true);

      // 🔹 Separate new files & existing images
      const newFiles = form.images.filter(img => img instanceof File);
      const existingImages = form.images.filter(img => img?.url);

      // 🔹 Start with existing Cloudinary images
      let finalImages = [...existingImages];

      // 🔹 Parallel Upload for better performance with 25 images
      if (newFiles.length > 0) {
        // Create an array of promises
        const uploadPromises = newFiles.map(file => uploadImageToCloudinary(file));
        
        // Wait for all uploads to complete
        const uploadedResults = await Promise.all(uploadPromises);
        finalImages = [...finalImages, ...uploadedResults];
      }

      // 🔹 Final payload
      const payload = {
        name: form.name,
        description: form.description,
        category: form.category,
        tags: form.tags,
        sizes: form.sizes,
        variants: form.variants,
        price: Number(form.price),
        wholesalePrice: Number(form.wholesalePrice) || 0,
        retail: {
          shippingCost: Number(form.retailShippingCost) || 0,
          taxPercentage: Number(form.retailTaxPercentage) || 0
        },
        wholesale: {
          shippingCost: Number(form.wholesaleShippingCost) || 0,
          taxPercentage: Number(form.wholesaleTaxPercentage) || 0
        },
        stock: totalStock,
        discountPercentage: Number(form.discountPercentage),
        discountStartDate: form.discountStartDate || null,
        discountEndDate: form.discountEndDate || null,
        images: finalImages
      };

      if (isEdit) {
        await adminApi.updateProduct(id, payload);
        setSuccessMessage('Product updated successfully!');
      } else {
        await adminApi.createProduct(payload);
        setSuccessMessage('Product created successfully!');
      }

      // Trigger Success Modal instead of navigate
      setShowSuccess(true);

    } catch (error) {
      console.error(error);
      toast.error('Save failed: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setForm({
        name: '', description: '', price: '', wholesalePrice: '',
        retailShippingCost: '', retailTaxPercentage: '',
        wholesaleShippingCost: '', wholesaleTaxPercentage: '',
        category: 'silk', discountPercentage: 0,
        discountStartDate: '', discountEndDate: '',
        variants: [], sizes: [], tags: [], images: [], imageAlt: ''
    });
    setFormErrors({});
    setShowSuccess(false);
  };

  const inputClass = (name) => `w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all duration-200 ${formErrors[name] ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 focus:border-rose-500 focus:ring-rose-500/10'}`;
  const labelClass = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const cardClass = "bg-white p-6 sm:p-8 rounded-2xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]";

  if (initialLoading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-rose-600" size={32} />
        <p className="text-sm font-medium text-slate-500">Loading details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 relative font-sans text-slate-900">
      
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
            <SuccessModal 
                isOpen={showSuccess}
                isEdit={isEdit}
                message={successMessage}
                onClose={() => isEdit ? setShowSuccess(false) : handleResetForm()}
                onNavigate={() => navigate('/admin/products')}
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCouponManager && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-2xl h-[90vh] sm:h-[80vh] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex-none px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800"><Ticket className="text-rose-500" size={20}/> Manage Coupons</h2>
                <button onClick={()=>setShowCouponManager(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                <AdminCouponManager />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin/products" className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:shadow-sm transition-all">
              <ArrowLeft size={20}/>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
              <p className="text-sm text-slate-500 mt-1">Manage details, pricing, and inventory.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => navigate('/admin/products')} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:text-slate-900 rounded-xl transition-colors">
               Cancel
             </button>
             <button onClick={handleSubmit} disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl flex items-center gap-2 hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100">
               {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
               {loading ? (isEdit ? 'Updating...' : 'Publishing...') : (isEdit ? 'Update Product' : 'Publish Product')}
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="xl:col-span-2 space-y-8">
            
            {/* General Info */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Layers size={20}/></div>
                General Information
              </h3>
              <div className="space-y-5">
                <div>
                  <label className={labelClass}>Product Name <span className="text-red-500">*</span></label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputClass('name')} placeholder="e.g. Kanchipuram Silk Saree" />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>Description <span className="text-red-500">*</span></label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={5} className={`${inputClass('description')} resize-y min-h-[120px]`} placeholder="Describe the fabric, weave, and occasion..." />
                  {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
                </div>
              </div>
            </div>

            {/* Images - INCREASED CAPACITY TO 25 */}
            <div className={cardClass}>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><ImageIcon size={20}/></div>
                  Media Gallery <span className="text-red-500">*</span>
                </h3>
                <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded">Max 25 images</span>
              </div>
              
              <ImageUploadArea
                images={form.images}
                maxImages={25}
                error={formErrors.images}
                onChange={(imgs) => {
                  const removed = form.images.filter(
                    img => typeof img === 'string' && !imgs.includes(img)
                  );
                  if (removed.length) {
                    setRemovedImageIds(prev => [...prev, ...removed]);
                  }
                  setForm(prev => ({ ...prev, images: imgs }));
                  if (imgs.length > 0) setFormErrors(prev => ({ ...prev, images: null }));
                }}
              />
              
              <div className="mt-5 pt-5 border-t border-slate-100">
                  <label className={labelClass}>Alt Text (SEO)</label>
                  <input name="imageAlt" value={form.imageAlt} onChange={handleChange} className={inputClass('imageAlt')} placeholder="Describe images for accessibility" />
              </div>
            </div>

            {/* VARIANTS & INVENTORY */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Box size={20}/></div>
                Inventory & Variants
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange} className={`${inputClass('category')} appearance-none cursor-pointer`}>
                      {categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Total Stock</label>
                  <div className="relative">
                      <input value={totalStock} readOnly className={`${inputClass('')} bg-slate-50 text-slate-500 font-medium`} />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">AUTO</div>
                  </div>
                </div>
              </div>

              {/* Add Variant Section */}
              <div className={`bg-slate-50 rounded-xl p-5 border ${formErrors.variants ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'}`}>
                <label className="text-sm font-bold text-slate-800 mb-4 block">Add Color Variant</label>
                <div className="flex flex-col lg:flex-row items-end gap-4">
                  <div className="w-full lg:flex-1">
                    <span className="text-xs text-slate-500 mb-1.5 block">Color Name</span>
                    <input 
                      value={newVariant.colorName} 
                      onChange={e => setNewVariant(p => ({...p, colorName: e.target.value}))}
                      className={inputClass('')} 
                      placeholder="e.g. Royal Blue"
                    />
                  </div>
                  <div className="w-full lg:w-auto flex flex-col">
                    <span className="text-xs text-slate-500 mb-1.5 block">Hex Code</span>
                    <div className="flex items-center gap-3 bg-white p-1.5 border border-slate-200 rounded-lg">
                      <div className="relative w-10 h-9 rounded overflow-hidden shadow-inner border border-slate-100 flex-shrink-0">
                        <input 
                          type="color" 
                          value={newVariant.hexCode}
                          onChange={e => setNewVariant(p => ({...p, hexCode: e.target.value}))}
                          className="absolute -top-2 -left-2 w-16 h-16 p-0 cursor-pointer"
                        />
                      </div>
                      <input 
                          value={newVariant.hexCode}
                          onChange={e => setNewVariant(p => ({...p, hexCode: e.target.value}))}
                          className="w-24 text-sm font-mono text-slate-600 outline-none uppercase"
                          maxLength={7}
                      />
                      <div className="h-6 w-px bg-slate-200 mx-1"></div>
                      <div className="flex gap-1 pr-1">
                        {PRESET_COLORS.slice(0, 5).map(c => (
                          <button 
                            key={c.name} 
                            type="button"
                            onClick={() => setNewVariant(p => ({...p, hexCode: c.hex, colorName: c.name}))}
                            className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform shadow-sm" 
                            style={{backgroundColor: c.hex}} 
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="w-full lg:w-auto flex items-center gap-3">
                    <div className="w-24">
                       <span className="text-xs text-slate-500 mb-1.5 block">Quantity</span>
                       <input 
                        type="number" min="0" 
                        value={newVariant.stock}
                        onChange={e => setNewVariant(p => ({...p, stock: e.target.value}))}
                        className={inputClass('')}
                      />
                    </div>
                    <button 
                      onClick={handleAddVariant} 
                      type="button" 
                      className="h-[42px] px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 hover:shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                      <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
                {formErrors.variants && <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.variants}</p>}
              </div>

              {/* Active Variants List */}
              <div className="mt-6">
                <div className="flex justify-between items-end mb-2 px-1">
                   <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Variants</h4>
                   <span className="text-xs text-slate-400">{form.variants.length} items</span>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode='popLayout'>
                    {form.variants.map((v, idx) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={`${v.hexCode}-${idx}`} 
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-white shadow-sm group hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full border border-slate-200 shadow-sm flex items-center justify-center relative overflow-hidden bg-slate-50">
                             <div className="absolute inset-0" style={{backgroundColor: v.hexCode}}></div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{v.colorName}</p>
                            <p className="text-xs font-mono text-slate-400 uppercase">{v.hexCode}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                             <span className="block text-xs text-slate-400">Stock</span>
                             <span className="text-sm font-bold text-slate-700">{v.stock}</span>
                          </div>
                          <button onClick={() => handleRemoveVariant(idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={18}/>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {form.variants.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                      <p className="text-sm text-slate-400">No variants added yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sizes Section */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Sizes
              </h3>

              <input
                type="text"
                placeholder="Type size and press Enter (e.g. S, M, XL)" 
                className={inputClass('sizes')}
                onKeyDown={(e) => handleAddItem(e, 'sizes')}
              />
              <p className="text-xs text-slate-500 mt-2">
                Press <kbd className="bg-slate-100 px-1 rounded border border-slate-300">Enter</kbd> after typing a size to add it to the list.
              </p>

              {form.sizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.sizes.map((size, index) => (
                    <span
                      key={index}
                      className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full text-sm"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('sizes', index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 h-fit xl:sticky xl:top-8">
            
            {/* Multi-Tier Pricing Card */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee size={20}/></div>
                Pricing Tiers
              </h3>
              <div className="space-y-5">
                {/* Retail Price */}
                <div>
                  <label className={labelClass}>Retail Price (₹) <span className="text-red-500">*</span></label>
                  <input 
                    name="price" 
                    type="number" 
                    value={form.price} 
                    onChange={handleChange} 
                    className={`${inputClass('price')} text-lg font-semibold`} 
                    placeholder="0.00" 
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                  <p className="text-xs text-slate-400 mt-1.5">Customer-facing price</p>
                </div>

                {/* Wholesale Price */}
                <div className="pt-4 border-t border-slate-100">
                  <label className={labelClass}>
                    <div className="flex items-center gap-2">
                      <TrendingDown size={14} className="text-indigo-500" />
                      Wholesale Price (₹)
                    </div>
                  </label>
                  <input 
                    name="wholesalePrice" 
                    type="number" 
                    value={form.wholesalePrice} 
                    onChange={handleChange} 
                    className={inputClass('wholesalePrice')} 
                    placeholder="0.00" 
                  />
                  <p className="text-xs text-slate-400 mt-1.5">B2B/Reseller pricing</p>

                  {/* Margin Display */}
                  {form.price && form.wholesalePrice && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">Margin</span>
                        <span className="font-bold text-indigo-700">
                          ₹{marginAmount.toLocaleString()} ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                      <label className={labelClass}>Discount</label>
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        {form.discountPercentage}% OFF
                      </span>
                  </div>
                  <div className="relative">
                    <input 
                      name="discountPercentage" 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={form.discountPercentage} 
                      onChange={handleChange} 
                      className={`${inputClass('discountPercentage')} pr-10`} 
                    />
                    <Percent size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* Final Price Display */}
                {form.price && (
                   <div className="bg-slate-50 rounded-lg p-3 flex justify-between items-center border border-slate-100">
                      <span className="text-xs text-slate-500 font-medium uppercase">Customer Pays</span>
                      <span className="text-lg font-bold text-emerald-600">
                        ₹{Math.round(form.price * (1 - form.discountPercentage/100)).toLocaleString()}
                      </span>
                   </div>
                )}
              </div>
            </div>

            {/* Shipping & Tax Card */}
            <div className={cardClass}>
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Truck size={20}/>
                </div>
                Logistics & Tax
              </h3>

              <div className="space-y-6">
                {/* RETAIL */}
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-sm font-bold text-slate-700 mb-3">Retail (Customers)</p>
                  <label className={labelClass}>Shipping Cost (₹)</label>
                  <input
                    name="retailShippingCost"
                    type="number"
                    min="0"
                    value={form.retailShippingCost}
                    onChange={handleChange}
                    className={inputClass('retailShippingCost')}
                  />
                  <label className={`${labelClass} mt-4`}>GST (%)</label>
                  <input
                    name="retailTaxPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={form.retailTaxPercentage}
                    onChange={handleChange}
                    className={inputClass('retailTaxPercentage')}
                  />
                </div>

                {/* WHOLESALE */}
                <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4">
                  <p className="text-sm font-bold text-indigo-700 mb-3">Wholesale (Resellers)</p>
                  <label className={labelClass}>Shipping Cost (₹)</label>
                  <input
                    name="wholesaleShippingCost"
                    type="number"
                    min="0"
                    value={form.wholesaleShippingCost}
                    onChange={handleChange}
                    className={inputClass('wholesaleShippingCost')}
                  />
                  <label className={`${labelClass} mt-4`}>GST (%)</label>
                  <input
                    name="wholesaleTaxPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={form.wholesaleTaxPercentage}
                    onChange={handleChange}
                    className={inputClass('wholesaleTaxPercentage')}
                  />
                </div>
              </div>
            </div>

            {/* Promotions */}
            <div className={`${cardClass} bg-gradient-to-br from-indigo-50 to-white border-indigo-100`}>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white text-indigo-600 shadow-sm mb-3">
                   <Ticket size={24}/>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Coupon Codes</h3>
                <p className="text-xs text-slate-500 mb-4 px-2">Manage discounts and seasonal offers for this product.</p>
                <button 
                  onClick={()=>setShowCouponManager(true)} 
                  className="w-full py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl text-sm font-semibold hover:bg-indigo-50 hover:border-indigo-300 transition-all shadow-sm"
                >
                  Manage Coupons
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminProductForm;