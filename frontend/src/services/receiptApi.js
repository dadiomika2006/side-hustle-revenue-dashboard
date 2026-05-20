import api from './api';

export const uploadReceipt = (formData) => api.post('/receipts/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const listReceipts = () => api.get('/receipts');
export const deleteReceipt = (id) => api.delete(`/receipts/${id}`);
export default { uploadReceipt, listReceipts, deleteReceipt };
