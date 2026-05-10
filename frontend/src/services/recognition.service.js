import api from './api';

export const recognitionService = {
  health: () => api.get('/recognition/health'),
  getDatasetStatus: () => api.get('/recognition/dataset-status'),
  capture: (studentNumId, formData) =>
    api.post(`/recognition/capture/${studentNumId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  train: () => api.post('/recognition/train'),
  recognize: (formData, subject) =>
    api.post('/recognition/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { subject },
    }),
  getLogs: () => api.get('/logs'),
  getDashboard: () => api.get('/logs/dashboard'),
};
