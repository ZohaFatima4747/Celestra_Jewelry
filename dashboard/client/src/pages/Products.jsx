import { useEffect, useState } from 'react';
import api from '../utils/api';
import ImageUploader from '../components/ImageUploader';
import './Products.css';

const emptyForm = { name: '', description: '', price: '', stock: '', category: '', sizes: '', colors: '', tags: '', images: [] };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/products').then((r) => setProducts(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (p) => {
    setForm({
      name: p.name, description: p.description || '', price: p.price,
      stock: p.stock, category: p.category || '',
      sizes: p.sizes?.join(', ') || '',
      colors: p.colors?.join(', ') || '',
      tags: p.tags?.join(', ') || '',
      images: p.images || [],
    });
    setModal(p);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name, description: form.description,
      price: Number(form.price), stock: Number(form.stock),
      category: form.category.trim().toLowerCase(),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
      images: form.images,
    };
    try {
      if (modal === 'add') await api.post('/admin/products', payload);
      else await api.put('/admin/products/' + modal._id, payload);
      setModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api.delete('/admin/products/' + id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()];

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (p.name.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)) &&
      (categoryFilter === 'all' || p.category === categoryFilter);
  });

  const imgSrc = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:1000';
    if (url.startsWith('/uploads/')) {
      const thumb = url.endsWith('-full.webp') ? url.replace(/-full\.webp$/, '-thumb.webp') : url;
      return base + thumb;
    }
    // Plain filename from seed data — served from /product-images
    return base + '/product-images/' + encodeURIComponent(url);
  };

  if (loading) return <div className="prod-loading">Loading products...</div>;

  return (
    <div className="products-page">
      <div className="prod-header">
        <div>
          <h2 className="prod-title">Products Management</h2>
          <span className="prod-count">{products.length} total products</span>
        </div>
        <button className="add-btn" onClick={openAdd}>+ Add Product</button>
      </div>

      <div className="prod-filters">
        <input className="prod-search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="prod-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="prod-table-wrap">
        <table className="prod-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="prod-empty">No products found</td></tr>}
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>{p.images?.[0] ? <img src={imgSrc(p.images[0])} alt={p.name} className="product-thumb" loading="lazy" /> : <span className="no-img">—</span>}</td>
                <td><div className="product-name">{p.name}</div></td>
                <td>{p.category || '—'}</td>
                <td>PKR {p.price?.toLocaleString()}</td>
                <td><span className={p.stock <= 5 ? 'stock-low' : 'stock-ok'}>{p.stock}</span></td>
                <td className="prod-actions">
                  <button className="edit-btn" onClick={() => openEdit(p)}>Edit</button>
                  <button className="del-btn" onClick={() => del(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="prod-cards">
        {filtered.length === 0 && <p className="prod-empty">No products found</p>}
        {filtered.map((p) => (
          <div key={p._id} className="prod-card">
            {p.images?.[0]
              ? <img src={imgSrc(p.images[0])} alt={p.name} className="prod-card__img" loading="lazy" />
              : <div className="prod-card__img--empty">—</div>}
            <div className="prod-card__body">
              <div className="prod-card__name">{p.name}</div>
              <div className="prod-card__meta">
                {p.category && <span className="prod-card__tag">{p.category}</span>}
                <span className="prod-card__tag">PKR {p.price?.toLocaleString()}</span>
                <span className={'prod-card__tag ' + (p.stock <= 5 ? 'stock-low' : 'stock-ok')}>Stock: {p.stock}</span>
              </div>
              <div className="prod-card__actions">
                <button className="edit-btn" onClick={() => openEdit(p)}>Edit</button>
                <button className="del-btn" onClick={() => del(p._id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="prod-modal-overlay" onClick={() => setModal(null)}>
          <div className="prod-modal-outer" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header-bar">
              <div className="modal-header-bar__left">
                <span className="modal-header-bar__icon">{modal === 'add' ? '✦' : '✎'}</span>
                <h3 className="modal-header-bar__title">{modal === 'add' ? 'Add Product' : 'Edit Product'}</h3>
              </div>
              <button className="modal-header-bar__close" onClick={() => setModal(null)} aria-label="Close">✕</button>
            </div>

            <div className="prod-modal-body">
              <form onSubmit={save} className="product-form">
                <label>
                  <span>Name *</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </label>
                <label>
                  <span>Category * <small>(new category auto-creates on website)</small></span>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required placeholder="e.g. anklets" />
                </label>
                <div className="form-row">
                  <label>
                    <span>Price (PKR) *</span>
                    <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </label>
                  <label>
                    <span>Stock *</span>
                    <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                  </label>
                </div>
                <label>
                  <span>Description</span>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </label>
                <div className="form-row">
                  <label>
                    <span>Sizes <small>(comma-separated)</small></span>
                    <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="e.g. 7, 8, Adjustable" />
                  </label>
                  <label>
                    <span>Colors <small>(comma-separated)</small></span>
                    <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="e.g. gold, silver, black" />
                  </label>
                </div>
                <label>
                  <span>Tags <small>(comma-separated)</small></span>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. gift, wedding, minimal" />
                </label>
                <label><span>Images</span></label>
                <ImageUploader value={form.images} onChange={(urls) => setForm({ ...form, images: urls })} />
                <div className="prod-modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="save-btn" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
