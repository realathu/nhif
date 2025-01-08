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