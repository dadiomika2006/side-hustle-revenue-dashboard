import api from './api';

export const listIncomeStreams = () => api.get('/income-streams');
export const createIncomeStream = (payload) => api.post('/income-streams', payload);
export const updateIncomeStream = (id, payload) => api.put(`/income-streams/${id}`, payload);
export const deleteIncomeStream = (id) => api.delete(`/income-streams/${id}`);

export default {
  listIncomeStreams,
  createIncomeStream,
  updateIncomeStream,
  deleteIncomeStream,
};
