import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  STAFF_ROLES,
  getRoleName as getRoleNameFromUser,
  getStaffHomePath as getStaffHomePathForUser,
  hasPermission as checkPermission,
  getEffectivePermissions,
  ROLE_LABELS
} from '../utils/staffConfig';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  /** Only true when we need to verify an existing session — avoids global spinner on public routes */
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const offlineToastAtRef = useRef(0);
  const busyToastAtRef = useRef(0);
  const offlineToastCooldownMs = 15000;
  const busyToastCooldownMs = 8000;
  const loginInFlightRef = useRef(false);
  /** Set true in login/register before setToken so follow-up /auth/me does not block the whole app */
  const authJustSucceededRef = useRef(false);

  const rawApiBase = (process.env.REACT_APP_API_URL || '/api/v1').trim();
  const normalizedApiBase = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
  const API_BASE_URL = process.env.NODE_ENV === 'production' && normalizedApiBase.startsWith('http://')
    ? normalizedApiBase.replace(/^http:\/\//i, 'https://')
    : normalizedApiBase;
  const API_TIMEOUT_MS = parseInt(process.env.REACT_APP_API_TIMEOUT_MS || '15000', 10);
  const BOOTSTRAP_TIMEOUT_MS = parseInt(process.env.REACT_APP_BOOTSTRAP_TIMEOUT_MS || '12000', 10);

  const isNetworkError = (err) => {
    const code = err?.code;
    const message = err?.message || '';
    return (
      !err?.response &&
      (['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(code) ||
        /Network Error|Failed to fetch|timeout/i.test(message))
    );
  };

  const fetchUser = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data.data.user);
      setConnectionIssue(false);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setConnectionIssue(false);
      } else if (status === 429) {
        // Server reached but rate-limited — do NOT show "offline"
        setConnectionIssue(false);
        const now = Date.now();
        if (now - busyToastAtRef.current > busyToastCooldownMs) {
          busyToastAtRef.current = now;
          toast.error('The server is busy. Please wait a minute and tap Try again.');
        }
      } else if (isNetworkError(error)) {
        setConnectionIssue(true);
        const now = Date.now();
        if (now - offlineToastAtRef.current > offlineToastCooldownMs) {
          offlineToastAtRef.current = now;
          toast.error('No internet connection or server is unreachable. Please try again.');
        }
      } else {
        // Other HTTP errors: server responded — not a generic "offline" state
        setConnectionIssue(false);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.timeout = API_TIMEOUT_MS;
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const silent = authJustSucceededRef.current;
      authJustSucceededRef.current = false;
      fetchUser({ silent });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
      setConnectionIssue(false);
    }
  }, [API_BASE_URL, API_TIMEOUT_MS, token, fetchUser]);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => {
      setLoading(false);
    }, BOOTSTRAP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading, BOOTSTRAP_TIMEOUT_MS]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setConnectionIssue(false);
    };
    const handleOffline = () => {
      setOnline(false);
      setConnectionIssue(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const login = async (emailOrPhone, password, isPhone = false) => {
    try {
      if (loginInFlightRef.current) {
        const msg = 'Signing in already in progress. Please wait...';
        toast.error(msg);
        return { success: false, error: msg };
      }
      loginInFlightRef.current = true;

      const loginData = isPhone
        ? { phone: emailOrPhone, password }
        : { email: emailOrPhone, password };

      const response = await axios.post('/auth/login', loginData);
      const { token: newToken, user: userData } = response.data.data;

      authJustSucceededRef.current = true;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('Login successful!');
      return { success: true, user: userData };
    } catch (error) {
      const status = error?.response?.status;
      const retryAfterHeader = error?.response?.headers?.['retry-after'];
      const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : null;

      const baseMessage = error.response?.data?.message || 'Login failed. Please try again.';
      let message = baseMessage;

      if (status === 429) {
        message = retryAfterSeconds
          ? `Too many login attempts. Please wait ${retryAfterSeconds} seconds and try again.`
          : 'Too many login attempts. Please try again later.';
      } else if (isNetworkError(error)) {
        message = 'Unable to reach the server. Please check your internet connection and try again.';
      }

      toast.error(message);
      return { success: false, error: message, retryAfterSeconds: status === 429 ? retryAfterSeconds : null };
    } finally {
      loginInFlightRef.current = false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data.data;

      authJustSucceededRef.current = true;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('Registration successful!');
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('token');
      sessionStorage.removeItem('march15PromoPopupShown');
      setToken(null);
      setUser(null);
      setConnectionIssue(false);
      delete axios.defaults.headers.common['Authorization'];
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const isAdmin = () => {
    const roleName = getRoleNameFromUser(user);
    return roleName === 'admin' || roleName === 'super_admin';
  };

  const isStaff = () => STAFF_ROLES.includes(getRoleNameFromUser(user));

  const getRoleName = () => getRoleNameFromUser(user);

  const getStaffHomePath = () => getStaffHomePathForUser(user);

  const hasPermission = (permission) => {
    if (permission === 'staff') {
      return isAdmin();
    }
    return checkPermission(user, permission);
  };

  const getRoleLabel = () => {
    const roleName = getRoleNameFromUser(user);
    return ROLE_LABELS[roleName] || roleName || 'User';
  };

  const value = {
    user,
    token,
    loading,
    online,
    connectionIssue,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isStaff,
    getRoleName,
    getRoleLabel,
    getStaffHomePath,
    hasPermission,
    getEffectivePermissions: () => getEffectivePermissions(user),
    fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
