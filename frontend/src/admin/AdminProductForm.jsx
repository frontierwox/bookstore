import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../services/admin';
import { productsApi } from '../services/products';

const categories = [
  { value: 'silk', label: 'Silk' },
  { value: 'cotton', label: 'Cotton' },
  { value: 'chiffon', label: 'Chiffon' },
  { value: 'georgette', label: 'Georgette' },
  { value: 'crepe', label: 'Crepe' },
  { value: 'banarasi', label: 'Banarasi' },
  { value: 'kanchipuram', label: 'Kanchipuram' },
  { value: 'other', label: 'Other' }
];

const AdminProductForm = ({ mode = 'create' }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = mode === 'edit';

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'silk',
    stock: 0,
    discountPercentage: 0,
    discountStartDate: '',
    discountEndDate: '',
    colors: '',
    sizes: '',
    tags: '',
    imageUrl: '',
    imageAlt: ''
  });

  useEffect(() => {
    const load = async () => {
      if (!isEdit || !id) return;

      try {
        setInitialLoading(true);
        const data = await productsApi.getProductById(id);
        const product = data.product;

        setForm((prev) => ({
          ...prev,
          name: product.name || '',
          description: product.description || '',
          price: product.price ?? '',
          category: product.category || 'silk',
          stock: product.stock ?? 0,
          discountPercentage: product.discountPercentage ?? 0,
          discountStartDate: product.discountStartDate ? new Date(product.discountStartDate).toISOString().split('T')[0] : '',
          discountEndDate: product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '',
          colors: Array.isArray(product.colors) ? product.colors.join(', ') : '',
          sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          imageUrl: product.images?.[0]?.url || '',
          imageAlt: product.images?.[0]?.alt || ''
        }));
      } catch (e) {
        console.error('Failed to load product', e);
        setError('Failed to load product');
      } finally {
        setInitialLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  const numericPrice = Number(form.price) || 0;
  const numericDiscount = Number(form.discountPercentage) || 0;

  const finalPrice = useMemo(() => {
    const discountAmount = (numericPrice * numericDiscount) / 100;
    return Math.max(0, numericPrice - discountAmount);
  }, [numericPrice, numericDiscount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toArray = (value) => {
    if (!value) return [];
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name || !form.description || form.price === '' || !form.category) {
      setError('Please fill in all required fields.');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      category: form.category,
      stock: Number(form.stock),
      discountPercentage: Number(form.discountPercentage) || 0,
      discountStartDate: form.discountStartDate || null,
      discountEndDate: form.discountEndDate || null,
      colors: toArray(form.colors),
      sizes: toArray(form.sizes),
      tags: toArray(form.tags),
      images: form.imageUrl ? [{ url: form.imageUrl, alt: form.imageAlt || form.name }] : []
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminApi.updateProduct(id, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      navigate('/admin/products');
    } catch (e) {
      console.error('Failed to save product', e);
      setError(e.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading product...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p>Manage product details, pricing and discounts</p>
        </div>
        <Link to="/admin/products" className="btn btn-secondary">
          Back to Products
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1rem' }}>
        <div className="form-group mb-3">
          <label>Product Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className="form-control" required />
        </div>

        <div className="form-group mb-3">
          <label>Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="form-control"
            rows={4}
            required
          />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group mb-3">
            <label>Price (₹) *</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          <div className="form-group mb-3">
            <label>Category *</label>
            <select name="category" value={form.category} onChange={handleChange} className="form-control" required>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group mb-3">
            <label>Stock</label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="form-control"
            />
            {Number(form.stock) < 10 && (
              <small style={{ color: '#f44336' }}>Low stock warning (below 10)</small>
            )}
          </div>

          <div className="form-group mb-3">
            <label>Discount (%)</label>
            <input
              name="discountPercentage"
              type="number"
              min="0"
              max="100"
              value={form.discountPercentage}
              onChange={handleChange}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group mb-3">
            <label>Discount Start Date</label>
            <input name="discountStartDate" type="date" value={form.discountStartDate} onChange={handleChange} className="form-control" />
          </div>

          <div className="form-group mb-3">
            <label>Discount End Date</label>
            <input name="discountEndDate" type="date" value={form.discountEndDate} onChange={handleChange} className="form-control" />
          </div>
        </div>

        <div className="price-preview" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
          <h4 style={{ marginTop: 0 }}>Real-time Price Preview</h4>
          <p>Original: ₹{numericPrice.toLocaleString('en-IN')}</p>
          <p>Discount: {numericDiscount}%</p>
          <p>
            Final Price: <strong>₹{finalPrice.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        <div className="form-group mb-3">
          <label>Colors (comma separated)</label>
          <input name="colors" value={form.colors} onChange={handleChange} className="form-control" placeholder="red, blue, green" />
        </div>

        <div className="form-group mb-3">
          <label>Sizes (comma separated)</label>
          <input name="sizes" value={form.sizes} onChange={handleChange} className="form-control" placeholder="S, M, L, XL" />
        </div>

        <div className="form-group mb-3">
          <label>Tags (comma separated)</label>
          <input name="tags" value={form.tags} onChange={handleChange} className="form-control" placeholder="wedding, festive" />
        </div>

        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group mb-3">
            <label>Image URL</label>
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} className="form-control" placeholder="https://..." />
          </div>
          <div className="form-group mb-3">
            <label>Image Alt</label>
            <input name="imageAlt" value={form.imageAlt} onChange={handleChange} className="form-control" placeholder="Product image" />
          </div>
        </div>

        {form.imageUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <label>Preview</label>
            <div>
              <img src={form.imageUrl} alt={form.imageAlt || form.name} style={{ maxWidth: 180, borderRadius: 8 }} />
            </div>
          </div>
        )}

        <div className="d-flex" style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/admin/products" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
