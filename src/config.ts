// Force production URL when deployed
const API_BASE = 'https://library.dmi.ac.tz';

export const API_ENDPOINTS = {
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
  students: `${API_BASE}/api/students`,
  dynamicFields: `${API_BASE}/api/dynamic-fields`,
  admin: `${API_BASE}/admin`,
  dashboard: `${API_BASE}/api/dashboard`,
  status: `${API_BASE}/api/students/status`
};
