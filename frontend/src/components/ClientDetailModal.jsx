import React, { useState, useEffect } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import api from '../services/api';

const ClientDetailModal = ({ client, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    notes: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        country: client.country || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put(`/clients/${client._id}`, formData);
      if (onSave) onSave(response.data);
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating client');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--color-surface)', borderRadius: '12px', padding: '24px',
        maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)' }}>Client Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '20px' }}>
            <MdClose />
          </button>
        </div>

        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Company</label>
            <input
              name="company"
              value={formData.company}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>State/Province</label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Zip Code</label>
            <input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Country</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              disabled={!isEditing}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit'
              }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={!isEditing}
              rows={3}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                background: isEditing ? 'var(--color-surface-2)' : 'transparent',
                border: isEditing ? '1px solid var(--color-border)' : 'none',
                color: 'var(--color-text)', fontSize: '13px', fontFamily: 'inherit', resize: 'vertical'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => isEditing ? setIsEditing(false) : onClose()}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--color-border)',
              background: 'transparent', color: 'var(--color-text)', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600
            }}
          >
            {isEditing ? 'Cancel' : 'Close'}
          </button>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: '#6366f1', color: 'white', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <MdEdit2 size={14} /> Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: '#10b981', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                opacity: loading ? 0.6 : 1
              }}
            >
              <MdSave size={14} /> {loading ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
