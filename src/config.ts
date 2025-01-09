// Force production URL when deployed
const API_BASE = 'https://library.dmi.ac.tz/api';

export const API_ENDPOINTS = {
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
  students: `${API_BASE}/students`,
  dynamicFields: `${API_BASE}/dynamic-fields`,
  admin: `${API_BASE}/admin`,
  dashboard: `${API_BASE}/dashboard`,
  status: `${API_BASE}/students/status`
};
