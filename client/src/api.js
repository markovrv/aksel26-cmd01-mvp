import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-user-type'] = userType;
  }
  return config;
});

export const authAPI = {
  registerStudent: (data) => api.post('/auth/student/register', data),
  registerCompany: (data) => api.post('/auth/company/register', data),
  registerAdmin: (data) => api.post('/auth/admin/register', data),
  loginStudent: (email, password) => api.post('/auth/student/login', { email, password }),
  loginCompany: (email, password) => api.post('/auth/company/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: (userType) => api.get('/auth/me'),
  adminLogin: (email, password) => api.post('/auth/admin/login', { email, password }),
};

export const eventsAPI = {
  getAll: (type = null, city = null, search = null) => {
    const params = {};
    if (type) params.type = type;
    if (city) params.city = city;
    if (search) params.search = search;
    return api.get('/events', { params });
  },
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
};

export const applicationsAPI = {
  submit: (data) => api.post('/applications', data),
  getStudentApplications: () => api.get('/student/applications'),
  getCompanyApplications: () => api.get('/company/applications'),
  updateStatus: (id, status) => api.put(`/applications/${id}`, { status }),
};

export const companyAPI = {
  getProfile: (id) => api.get(`/company/${id}`),
  getDashboard: () => api.get('/company/dashboard'),
};

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
};

export const adminAPI = {
  getCompanies: () => api.get('/admin/companies'),
  updateCompanyStatus: (id, status) => api.put(`/admin/company/${id}/status`, { status }),
  getStudents: () => api.get('/admin/students'),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  getEvents: () => api.get('/admin/events'),
  updateEventStatus: (id, status) => api.put(`/admin/events/${id}/status`, { status }),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  getApplications: () => api.get('/admin/applications'),
  updateApplicationStatus: (id, status) => api.put(`/admin/applications/${id}/status`, { status }),
  getAdmins: () => api.get('/admin/admins'),
  getStats: () => api.get('/admin/stats'),
  getLogs: () => api.get('/admin/logs'),
};

export default api;
