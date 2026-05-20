import api from './api';

export const listTaxBuckets = () => api.get('/tax-buckets');
export const getTaxBucketSummary = () => api.get('/tax-buckets/summary');
export const createTaxBucket = (payload) => api.post('/tax-buckets', payload);
export const updateTaxBucket = (id, payload) => api.put(`/tax-buckets/${id}`, payload);
export const deleteTaxBucket = (id) => api.delete(`/tax-buckets/${id}`);

export default {
  listTaxBuckets,
  getTaxBucketSummary,
  createTaxBucket,
  updateTaxBucket,
  deleteTaxBucket,
};