import api from './api';

export const getAdminOverview = () => api.get('/dashboard/admin-overview');
export const listUsers = () => api.get('/auth/users');
export const updateUserRole = (id, role) => api.put(`/auth/users/${id}/role`, { role });

export default {
  getAdminOverview,
  listUsers,
  updateUserRole
};