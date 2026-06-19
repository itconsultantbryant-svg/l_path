import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { resolveWhatsAppUrl } from '../utils/whatsapp';

const WhatsAppContext = createContext({
  supportUrl: null,
  supportEnabled: false,
  newUsers: { url: null, enabled: false },
  official: { url: null, enabled: false },
  dashboard: null,
  hasApprovedDeposit: false,
  isActiveUser: false,
  chatUrl: null,
  loading: true,
  refresh: () => {}
});

export const useWhatsApp = () => useContext(WhatsAppContext);

const ENV_SUPPORT_FALLBACK = process.env.REACT_APP_WHATSAPP_GROUP_URL || '';
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export const WhatsAppProvider = ({ children }) => {
  const { token, loading: authLoading } = useAuth();
  const [supportUrl, setSupportUrl] = useState(null);
  const [supportEnabled, setSupportEnabled] = useState(false);
  const [newUsers, setNewUsers] = useState({ url: null, enabled: false, contact: null });
  const [official, setOfficial] = useState({ url: null, enabled: false, contact: null });
  const [dashboard, setDashboard] = useState(null);
  const [hasApprovedDeposit, setHasApprovedDeposit] = useState(false);
  const [isActiveUser, setIsActiveUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async (silent = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (!silent) setLoading(true);

    try {
      const requests = [axios.get('/settings/whatsapp')];
      if (token && !authLoading) {
        requests.push(axios.get('/settings/whatsapp/me'));
      }

      const results = await Promise.allSettled(requests);
      const supportRes = results[0];
      const userRes = results[1];

      if (supportRes.status === 'fulfilled') {
        const supportData = supportRes.value.data?.data || {};
        const supportLink = supportData.url || resolveWhatsAppUrl(ENV_SUPPORT_FALLBACK);
        setSupportUrl(supportLink);
        setSupportEnabled(supportData.enabled !== false && Boolean(supportLink));
      } else {
        const fallback = resolveWhatsAppUrl(ENV_SUPPORT_FALLBACK);
        setSupportUrl(fallback);
        setSupportEnabled(Boolean(fallback));
      }

      if (userRes?.status === 'fulfilled' && userRes.value?.data?.data) {
        const data = userRes.value.data.data;
        setNewUsers(data.newUsers || { url: null, enabled: false });
        setOfficial(data.official || { url: null, enabled: false });
        setDashboard(data.dashboard || null);
        setHasApprovedDeposit(Boolean(data.hasApprovedDeposit));
        setIsActiveUser(Boolean(data.isActiveUser));
      } else if (token) {
        setNewUsers({ url: null, enabled: false, contact: null });
        setOfficial({ url: null, enabled: false, contact: null });
        setDashboard(null);
        setHasApprovedDeposit(false);
        setIsActiveUser(false);
      }
    } catch {
      const fallback = resolveWhatsAppUrl(ENV_SUPPORT_FALLBACK);
      setSupportUrl(fallback);
      setSupportEnabled(Boolean(fallback));
      setDashboard(null);
    } finally {
      fetchingRef.current = false;
      if (!silent) setLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    refresh();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refresh(true);
      }
    }, POLL_INTERVAL_MS);

    const onFocus = () => refresh(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh]);

  const chatUrl = dashboard?.url || newUsers.url || supportUrl;

  return (
    <WhatsAppContext.Provider
      value={{
        url: supportUrl,
        enabled: supportEnabled,
        supportUrl,
        supportEnabled,
        newUsers,
        official,
        dashboard,
        hasApprovedDeposit,
        isActiveUser,
        chatUrl,
        loading,
        refresh
      }}
    >
      {children}
    </WhatsAppContext.Provider>
  );
};
