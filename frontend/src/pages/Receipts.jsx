import React, { useEffect, useState } from 'react';
import { MdCloudUpload, MdDelete, MdInsertDriveFile } from 'react-icons/md';
import receiptApi from '../services/receiptApi';

export default function Receipts() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const loadReceipts = async () => {
    setListLoading(true);
    try {
      const res = await receiptApi.listReceipts();
      setFiles(res.data.receipts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => { 
    loadReceipts(); 
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setIsSuccess(false);
      setMessage('Please select a receipt file first.');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    const data = new FormData();
    data.append('receipt', file);
    
    try {
      await receiptApi.uploadReceipt(data);
      setFile(null);
      setIsSuccess(true);
      setMessage('✓ Receipt uploaded successfully!');
      loadReceipts();
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setMessage('Failed to upload receipt. Supported formats: Images, PDF (Max 5MB).');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt permanently? This will break references on existing transactions.')) return;
    try {
      await receiptApi.deleteReceipt(id);
      loadReceipts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Receipt &amp; Document Storage</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Upload and store digital receipts to attach to business transactions.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        {/* Upload Card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', color: '#e2e8f0' }}>📤 Upload Receipt</h2>
          
          {message && (
            <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '16px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpload}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ marginBottom: '10px' }}>Select Image or PDF</label>
              
              <div style={{
                border: '2px dashed rgba(99,102,241,0.25)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(30,41,59,0.3)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s ease'
              }}>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)} 
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, cursor: 'pointer'
                  }}
                />
                <MdCloudUpload size={32} style={{ color: '#6366f1', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                  {file ? file.name : 'Choose receipt file'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  {file ? `${Math.round(file.size / 1024)} KB` : 'Supports PNG, JPG, PDF up to 5MB'}
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !file}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {loading ? 'Uploading...' : 'Upload Receipt'}
            </button>
          </form>
        </div>

        {/* Saved Receipts Card */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px', color: '#e2e8f0' }}>📂 Uploaded Receipts Vault</h2>
          
          {listLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" /></div>
          ) : files.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-state-icon" style={{ fontSize: '32px' }}>📄</div>
              <h3>No receipts found</h3>
              <p style={{ maxWidth: '280px', margin: '8px auto 0', fontSize: '13px' }}>Upload receipts using the left form to secure them in the vault.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {files.map((receipt) => (
                <div key={receipt._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(30,41,59,0.3)',
                  border: '1px solid rgba(99,102,241,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '8px',
                      background: 'rgba(99,102,241,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <MdInsertDriveFile size={20} style={{ color: '#a5b4fc' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '14px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {receipt.originalName || receipt.filename}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Uploaded {new Date(receipt.uploadedAt).toLocaleDateString()} · {Math.round((receipt.size || 0) / 1024)} KB
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a 
                      href={`/api/receipts/${receipt._id}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      View File
                    </a>
                    <button 
                      onClick={() => handleDelete(receipt._id)} 
                      className="btn btn-danger" 
                      style={{ padding: '6px 10px' }}
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
