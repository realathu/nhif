const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE = isDevelopment 
  ? 'http://localhost:3000' 
  : 'https://library.dmi.ac.tz';

export const API_ENDPOINTS = {
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
  students: `${API_BASE}/api/students`,
  dynamicFields: `${API_BASE}/api/dynamic-fields`,
  admin: `${API_BASE}/admin`,
  dashboard: `${API_BASE}/api/dashboard`,
  status: `${API_BASE}/api/students/status`
};
