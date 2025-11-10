import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

axios.defaults.baseURL = API_BASE_URL;

export const equipmentApi = {
  getAll: (params?: any) => axios.get('/equipment', { params }),
  getById: (id: string) => axios.get(`/equipment/${id}`),
  create: (data: any) => axios.post('/equipment', data),
  update: (id: string, data: any) => axios.put(`/equipment/${id}`, data),
  delete: (id: string) => axios.delete(`/equipment/${id}`),
};

export const borrowingApi = {
  getAll: (params?: any) => axios.get('/borrowings', { params }),
  create: (data: any) => axios.post('/borrowings', data),
  approve: (id: string) => axios.patch(`/borrowings/${id}/approve`),
  reject: (id: string, notes?: string) => axios.patch(`/borrowings/${id}/reject`, { notes }),
  issue: (id: string) => axios.patch(`/borrowings/${id}/issue`),
  return: (id: string, data?: any) => axios.patch(`/borrowings/${id}/return`, data),
};

export const userApi = {
  getAll: () => axios.get('/users'),
  getStats: () => axios.get('/users/stats'),
};