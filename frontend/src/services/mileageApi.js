import api from './api';

export const createMileage = (data) => api.post('/mileage', data);
export const listMileage = () => api.get('/mileage');
export const getMileage = (id) => api.get(`/mileage/${id}`);
export const deleteMileage = (id) => api.delete(`/mileage/${id}`);
export const summaryMonthly = () => api.get('/mileage/summary/monthly');

export default { createMileage, listMileage, getMileage, deleteMileage, summaryMonthly };
