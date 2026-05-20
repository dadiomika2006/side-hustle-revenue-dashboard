import React, { useState } from 'react';
import { MdInventory, MdAdd } from 'react-icons/md';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMoney } from '../utils/formatMoney.js';

const SAMPLE = [
  { id: 1, name: 'Web Design Package', price: 1500, category: 'Design', description: 'Full website design including mockups and revisions.' },
  { id: 2, name: 'SEO Audit', price: 350, category: 'Marketing', description: 'Comprehensive SEO analysis and recommendations report.' },
  { id: 3, name: 'Monthly Retainer', price: 800, category: 'Consulting', description: 'Ongoing support and consulting — 10 hrs/month.' },
];

const Products = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'USD';
  const [products, setProducts] = useState(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', category: '', description: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    setProducts([...products, { ...form, id: Date.now(), price: parseFloat(form.price) }]);
    setForm({ name: '', price: '', category: '', description: '' });
    setShowForm(false);
  };

  const handleDelete = (id) => setProducts(products.filter(p => p.id !== id));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Products &amp; Services</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <MdAdd size={18} /> {showForm ? 'Cancel' : 'Add Item'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-slide-up" style={{ maxWidth: '560px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '18px' }}>New Product / Service</h2>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="form-input" placeholder="e.g. Logo Design" required />
              </div>
              <div className="form-group">
                <label className="form-label">Price</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="form-input" placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="form-input" placeholder="e.g. Design" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="form-input" placeholder="Short description" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">✓ Add</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {products.map(p => (
          <div key={p.id} className="card" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdInventory style={{ color: '#6366f1', fontSize: '20px' }} />
              </div>
              {p.category && <span className="badge badge-info">{p.category}</span>}
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>{p.name}</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', minHeight: '36px' }}>{p.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>{formatMoney(p.price, currency)}</span>
              <button onClick={() => handleDelete(p.id)} className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;