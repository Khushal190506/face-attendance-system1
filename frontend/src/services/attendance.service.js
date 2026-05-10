import api from './api';

export const attendanceService = {
  getAll: (params) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  getAnalytics: () => api.get('/attendance/analytics'),
  getByStudent: (id) => api.get(`/attendance/student/${id}`),
  mark: (data) => api.post('/attendance', data),
  delete: (id) => api.delete(`/attendance/${id}`),
  exportExcel: (params) => api.get('/attendance/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params) => api.get('/attendance/export/pdf', { params, responseType: 'blob' }),
};
