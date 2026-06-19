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
import { getApiBaseUrl, getApiTimeoutMs, getBootstrapTimeoutMs } from '../utils/apiConfig';
import { isRetryableNetworkError, warmupApi } from '../utils/axiosSetup';

const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT_MS = getApiTimeoutMs();
const BOOTSTRAP_TIMEOUT_MS = getBootstrapTimeoutMs();

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const postWithNetworkRetry = async (url, data) => {
  try {
    return await axios.post(url, data);
  } catch (error) {
    if (!isRetryableNetworkError(error)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return axios.post(url, data);
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'));
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [connectionIssue, setConnectionIssue] = useState(false);
  const [online, setOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [apiReady, setApiReady] = useState(process.env.NODE_ENV !== 'production');
  const offlineToastAtRef = useRef(0);
  const busyToastAtRef = useRef(0);
  const offlineToastCooldownMs = 15000;
  const busyToastCooldownMs = 8000;
  const loginInFlightRef = useRef(false);
  const authJustSucceededRef = useRef(false);
  const tokenRef = useRef(token);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    warmupApi().finally(() => {
      if (!cancelled) setApiReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
        setConnectionIssue(false);
        const now = Date.now();
        if (now - busyToastAtRef.current > busyToastCooldownMs) {
          busyToastAtRef.current = now;
          toast.error('The server is busy. Please wait a minute and tap Try again.');
        }
      } else if (isRetryableNetworkError(error)) {
        setConnectionIssue(true);
        const now = Date.now();
        if (now - offlineToastAtRef.current > offlineToastCooldownMs) {
          offlineToastAtRef.current = now;
          toast.error('Connection is slow or the server is starting. Please wait and try again.');
        }
      } else {
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
  }, [token, fetchUser]);

  useEffect(() => {
    if (!loading) return undefined;
    const timer = setTimeout(() => {
      setLoading(false);
    }, BOOTSTRAP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (tokenRef.current) {
        fetchUser({ silent: true });
      }
    };
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchUser]);

  const login = async (emailOrPhone, password, isPhone = false) => {
    try {
      if (loginInFlightRef.current) {
        const msg = 'Signing in already in progress. Please wait...';
        toast.error(msg);
        return { success: false, error: msg };
      }
      loginInFlightRef.current = true;

      if (!apiReady) {
        await warmupApi();
        setApiReady(true);
      }

      const loginData = isPhone
        ? { phone: emailOrPhone, password }
        : { email: emailOrPhone, password };

      const response = await postWithNetworkRetry('/auth/login', loginData);
      const { token: newToken, user: userData } = response.data.data;

      authJustSucceededRef.current = true;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setConnectionIssue(false);
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
      } else if (isRetryableNetworkError(error)) {
        message = 'Connection timed out. Orange, Lonestar, and WiFi networks can be slow — please wait a moment and try again.';
      }

      toast.error(message);
      return { success: false, error: message, retryAfterSeconds: status === 429 ? retryAfterSeconds : null };
    } finally {
      loginInFlightRef.current = false;
    }
  };

  const register = async (userData) => {
    try {
      if (!apiReady) {
        await warmupApi();
        setApiReady(true);
      }

      const response = await postWithNetworkRetry('/auth/register', userData);
      const { token: newToken, user: newUser } = response.data.data;

      authJustSucceededRef.current = true;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setConnectionIssue(false);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      toast.success('Registration successful!');
      return { success: true, user: newUser };
    } catch (error) {
      let message = error.response?.data?.message || 'Registration failed. Please try again.';
      if (isRetryableNetworkError(error)) {
        message = 'Connection timed out. Please wait a moment and try again.';
      }
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
    apiReady,
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
