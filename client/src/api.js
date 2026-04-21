import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
  register: (data) => api.post('/auth/register', data),
  registerStudent: (data) => api.post('/auth/register', { ...data, role: 'student' }),
  registerCompany: (data) => api.post('/auth/register', { ...data, role: 'company' }),
  registerAdmin: (data) => api.post('/auth/register', { ...data, role: 'admin' }),
  login: (email, password, role) => api.post('/auth/login', { email, password, role }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

export const casesAPI = {
  getAll: (type = null, search = null) => {
    const params = {};
    if (type) params.type = type;
    if (search) params.search = search;
    return api.get('/cases', { params });
  },
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
  deleteCompanyCase: (id) => api.delete(`/cases/${id}`),
};

export const solutionsAPI = {
  submit: (data) => api.post('/solutions', data),
  submitSolution: (data) => api.post('/solutions', data),
  getMy: () => api.get('/student/solutions'),
  getByCase: (caseId) => api.get(`/cases/${caseId}/solutions`),
  getCompany: () => api.get('/company/solutions'),
  updateStatus: (id, status) => api.put(`/solutions/${id}`, { status }),
};

export const companyAPI = {
  getProfile: (id) => api.get(`/companies/${id}`),
  getActiveCases: () => api.get('/map/companies'),
  getDashboard: () => api.get('/company/dashboard'),
  updateProfile: (data) => api.put('/company/profile', data),
};

export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  updateProfile: (data) => api.put('/student/profile', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export const adminAPI = {
  getCompanies: () => api.get('/admin/companies'),
  updateCompanyStatus: (id, status) => api.put(`/admin/companies/${id}/status`, { status }),
  getStudents: () => api.get('/admin/students'),
  deleteStudent: (id) => api.delete(`/admin/students/${id}`),
  getCases: () => api.get('/admin/cases'),
  updateCaseStatus: (id, status) => api.put(`/admin/cases/${id}/status`, { status }),
  deleteCase: (id) => api.delete(`/admin/cases/${id}`),
  getSolutions: () => api.get('/admin/solutions'),
  updateSolutionStatus: (id, status) => api.put(`/solutions/${id}`, { status }),
  getAdmins: () => api.get('/admin/admins'),
  getLogs: () => api.get('/admin/logs'),
  getStats: () => api.get('/admin/stats'),
};

export default api;