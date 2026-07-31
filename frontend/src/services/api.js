import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kiranapulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('kiranapulse_token');
      localStorage.removeItem('kiranapulse_user');
    }
    return Promise.reject(error);
  }
);

export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const fetchProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const response = await api.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export const analyzeProductImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/products/analyze-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getStoreProfile = async () => {
  const response = await api.get('/store/me');
  return response.data;
};

export const updateStoreProfile = async (storeData) => {
  const response = await api.put('/store/me', storeData);
  return response.data;
};

export const addEmployee = async (employeeData) => {
  const response = await api.post('/store/employees', employeeData);
  return response.data;
};

export const getTodaysSales = async () => {
  const response = await api.get('/sales/today');
  return response.data;
};

export const recordSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

export const analyzeShelfImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/shelf/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getLatestShelfScan = async () => {
  const response = await api.get('/shelf/scan/latest');
  return response.data;
};

export const extractOCRImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/ocr/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getOCRHistory = async () => {
  const response = await api.get('/ocr/history');
  return response.data;
};

// --- Notifications ---
export const fetchNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const triggerAnalysis = async () => {
  const response = await api.post('/notifications/trigger-analysis');
  return response.data;
};

// --- Analytics ---
export const fetchAnalyticsDashboard = async () => {
  const response = await api.get('/analytics/dashboard');
  return response.data;
};

// --- AI Chat ---
export const fetchChatHistory = async () => {
  const response = await api.get('/chat/history');
  return response.data;
};

export const sendChatMessage = async (message) => {
  const response = await api.post('/chat/message', { message });
  return response.data;
};

export default api;
