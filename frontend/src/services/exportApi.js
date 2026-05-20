import api from './api';

export const downloadCSV = (params) => api.get('/export/csv', { params, responseType: 'blob' });
export const downloadScheduleC = (params) => api.get('/export/schedule-c', { params, responseType: 'blob' });

export default { downloadCSV, downloadScheduleC };
