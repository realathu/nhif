import { API_ENDPOINTS } from '../config';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';

export const auth = {
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setRole(role: string) {
    localStorage.setItem(ROLE_KEY, role);
  },

  getRole(): string | null {
    return localStorage.getItem(ROLE_KEY);
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async login(email: string, password: string) {
    const response = await fetch(API_ENDPOINTS.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(email: string, password: string) {
    const response = await fetch(API_ENDPOINTS.register, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
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