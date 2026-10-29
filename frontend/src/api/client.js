import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_KEY = 'durus.token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors + auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;

    if (status === 401) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    err.userMessage =
      data?.message ||
      (err.code === 'ERR_NETWORK' ? 'Network error — is the server running?' : err.message);

    return Promise.reject(err);
  }
);

// ---- Endpoint helpers ----

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.patch('/auth/profile', payload).then((r) => r.data),
};

export const lecturesApi = {
  // Browse (grouped by default, or flat when filters passed)
  list: (params) => api.get('/lectures', { params }).then((r) => r.data),
  get: (id) => api.get(`/lectures/${id}`).then((r) => r.data),
  create: (payload) => api.post('/lectures', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/lectures/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/lectures/${id}`).then((r) => r.data),
  
  // Direct server-side upload (Bypasses R2 browser CORS completely)
  uploadMedia: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/lectures/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  },
};

export const adminApi = {
  overview: () => api.get('/admin/overview').then((r) => r.data),
  students: () => api.get('/admin/students').then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  updateUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  
  // NEW: Certificates
  certificates: () => api.get('/admin/certificates').then((r) => r.data),
  issueCertificate: (payload) => api.post('/admin/certificates', payload).then((r) => r.data),
  updateCertificateStatus: (id, status) => api.patch(`/admin/certificates/${id}/status`, { status }).then((r) => r.data),
};

// Used by Lesson Management page (tree, arts, books, lecture patches)
export const adminTreeApi = {
  // Full tree: arts → books → lectures
  tree: () => api.get('/admin/tree').then((r) => r.data),

  // Arts
  createArt: (payload) => api.post('/admin/arts', payload).then((r) => r.data),
  updateArt: (id, payload) => api.patch(`/admin/arts/${id}`, payload).then((r) => r.data),
  deleteArt: (id) => api.delete(`/admin/arts/${id}`).then((r) => r.data),

  // Books
  createBook: (artId, payload) =>
    api.post(`/admin/arts/${artId}/books`, payload).then((r) => r.data),
  updateBook: (id, payload) => api.patch(`/admin/books/${id}`, payload).then((r) => r.data),
  deleteBook: (id) => api.delete(`/admin/books/${id}`).then((r) => r.data),

  // Lecture patch (title, type, duration, status)
  patchLecture: (id, payload) =>
    api.patch(`/admin/lectures/${id}`, payload).then((r) => r.data),
};

export const progressApi = {
  heartbeat: (lectureId, payload) =>
    api.post(`/progress/${lectureId}`, payload).then((r) => r.data),
  forLecture: (lectureId) =>
    api.get(`/progress/lecture/${lectureId}`).then((r) => r.data),
  me: () => api.get('/progress/me').then((r) => r.data),
  forBook: (params) => api.get('/progress/book', { params }).then((r) => r.data),
};

export const browseApi = {
  get: (params) => api.get('/browse', { params }).then((r) => r.data),
};