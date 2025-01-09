import { API_ENDPOINTS } from '../config';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

export const auth = {
  async login(email: string, password: string) {
    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check server configuration.');
        }
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setRole(data.role);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  },

  async register(email: string, password: string) {
    try {
      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API endpoint not found. Please check server configuration.');
        }
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      this.setToken(data.token);
      this.setRole(data.role);
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setRole(role: string) {
    localStorage.setItem(ROLE_KEY, role);
  },

  getRole() {
    return localStorage.getItem(ROLE_KEY);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};

// Helper function for external services
export const getAuthToken = (): string => {
  const token = auth.getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
};