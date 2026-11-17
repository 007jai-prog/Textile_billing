import { api } from './api';

export const authService = {
  register: async (registerData) => {
    const res = await api.post('/auth/register', registerData);
    return res.data;
  },

  login: async (identifier, password, rememberMe = true) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.access_token) {
      if (rememberMe) {
        localStorage.setItem('texbill_token', res.data.access_token);
        localStorage.setItem('texbill_user', JSON.stringify(res.data.user));
        sessionStorage.removeItem('texbill_token');
        sessionStorage.removeItem('texbill_user');
      } else {
        sessionStorage.setItem('texbill_token', res.data.access_token);
        sessionStorage.setItem('texbill_user', JSON.stringify(res.data.user));
        localStorage.removeItem('texbill_token');
        localStorage.removeItem('texbill_user');
      }
    }
    return res.data;
  },

  // Google OAuth URL
  getGoogleAuthUrl: async (redirectUri) => {
    const params = new URLSearchParams();
    if (redirectUri) params.append('redirect_uri', redirectUri);
    const res = await api.get(`/auth/oauth/google/url?${params.toString()}`);
    return res.data;
  },

  // Microsoft OAuth URL
  getMicrosoftAuthUrl: async (redirectUri) => {
    const params = new URLSearchParams();
    if (redirectUri) params.append('redirect_uri', redirectUri);
    const res = await api.get(`/auth/oauth/microsoft/url?${params.toString()}`);
    return res.data;
  },

  // Exchange OAuth authorization code
  handleOAuthCallback: async (provider, code, redirectUri) => {
    const res = await api.post('/auth/oauth/callback', {
      provider,
      code,
      redirect_uri: redirectUri
    });
    if (res.data.access_token) {
      localStorage.setItem('texbill_token', res.data.access_token);
      localStorage.setItem('texbill_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Complete OAuth store registration when store information is required
  completeOAuthStoreSetup: async (setupData) => {
    const res = await api.post('/auth/oauth/complete-setup', setupData);
    if (res.data.access_token) {
      localStorage.setItem('texbill_token', res.data.access_token);
      localStorage.setItem('texbill_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Forgot password request
  forgotPassword: async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  // Reset password submission
  resetPassword: async (token, newPassword) => {
    const res = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('texbill_token');
    localStorage.removeItem('texbill_user');
    sessionStorage.removeItem('texbill_token');
    sessionStorage.removeItem('texbill_user');
  },

  getCurrentUser: () => {
    try {
      const data = localStorage.getItem('texbill_user') || sessionStorage.getItem('texbill_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('texbill_token') || sessionStorage.getItem('texbill_token');
  }
};
