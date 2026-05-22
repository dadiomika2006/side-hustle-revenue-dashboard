import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // On mount: verify token and load current user
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (err) {
          console.error('Auth init error:', err);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  useEffect(() => {
    const theme = user?.themeMode === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [user?.themeMode]);

  // Register a new user
  const register = async (credentials) => {
    try {
      const response = await api.post('/auth/register', credentials);
      const { token: newToken, user: newUser } = response.data;
      if (newToken && newUser) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
      }
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Register error:', err);
      setError(err);
      throw err;
    }
  };

  // Login existing user
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token: newToken, user: newUser } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err);
      throw err;
    }
  };

  // ── Added for OTP login (sets token + user into context) ────────────────
  const loginWithToken = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setError(null);
  };
  // ────────────────────────────────────────────────────────────────────────

  // Update current user profile
  const updateProfile = async (data) => {
    try {
      const response = await api.put('/auth/me', data);
      setUser(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err);
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    register,
    updateProfile,
    loginWithToken, // ← added
    loading,
    error,
    isAuthenticated: !!token,
    isAdmin: !!user && user.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};