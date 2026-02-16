// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://robotech-tjw0.onrender.com/api',
  // ❌ NO fuerces Content-Type aquí
});

api.interceptors.request.use((config) => {
  // ✅ Si es FormData, deja que el browser ponga multipart con boundary
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
  } else {
    // ✅ Para JSON normal, sí
    config.headers = config.headers ?? {};
    (config.headers as any)['Content-Type'] = 'application/json';
  }

  // Token
  let token = localStorage.getItem('access_token');
  if (!token) {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        token = u?.access_token || u?.accessToken || u?.token || u?.jwt || null;
      } catch {
        token = null;
      }
    }
  }

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
