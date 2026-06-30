import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://mashy-backend.onrender.com/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('org_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('org_token');
      localStorage.removeItem('org_user');
      window.location.href = '/login';
    }
    const msg = err.response?.data?.error || 'حدث خطأ';
    return Promise.reject(new Error(msg));
  }
);

export default api;
