import React, { useState } from 'react';
import exportApi from '../services/exportApi';

export default function ExportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [csvLoading, setCsvLoading] = useState(false);
  const [taxLoading, setTaxLoading] = useState(false);

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await exportApi.downloadCSV({ startDate, endDate });
      const blob = new Blob([res.data], { type: 'text/csv' });
      downloadBlob(blob, `transactions_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    } catch (err) { 
      console.error(err); 
    } finally {
      setCsvLoading(false);
    }
  };

  const handleScheduleC = async () => {
    setTaxLoading(true);
    try {
      const res = await exportApi.downloadScheduleC({ year });
      const blob = new Blob([res.data], { type: 'text/csv' });
      downloadBlob(blob, `schedule_c_report_${year}.csv`);
    } catch (err) { 
      console.error(err); 
    } finally {
      setTaxLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Export Reports &amp; Taxes</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Extract your financial logs and structured tax preparation spreadsheets.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '960px' }}>
        {/* CSV Export Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>All Transactions CSV</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px', minHeight: '36px' }}>
            Download your raw history of income entries, business expenses, and client-associated transactions.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="form-input" 
              />
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleCSV} 
            disabled={csvLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {csvLoading ? 'Generating CSV...' : '📥 Download CSV Spreadsheet'}
          </button>
        </div>

        {/* Schedule C Export Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '24px' }}>💼</span>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#e2e8f0', margin: 0 }}>Schedule C Tax Sheet</h2>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px', minHeight: '36px' }}>
            Export business expenses organized by formal IRS Schedule C categories for quick tax filing.
          </p>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Tax Year</label>
            <input 
              type="number" 
              value={year} 
              onChange={e => setYear(e.target.value)} 
              className="form-input" 
              placeholder="e.g. 2026"
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleScheduleC} 
            disabled={taxLoading}
            style={{ width: '100%', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }}
          >
            {taxLoading ? 'Generating Sheet...' : '📥 Download Schedule C Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
