// API Configuration
const API_BASE = 'https://library.dmi.ac.tz';

export const API_ENDPOINTS = {
  // Auth endpoints
  login: `${API_BASE}/api/auth/login`,
  register: `${API_BASE}/api/auth/register`,
  
  // Student endpoints
  students: `${API_BASE}/api/students`,
  status: `${API_BASE}/api/students/status`,
  
  // Dynamic fields
  dynamicFields: `${API_BASE}/api/dynamic-fields`,
  
  // Admin endpoints
  admin: `${API_BASE}/api/admin`,
  dashboard: `${API_BASE}/api/dashboard`
};
