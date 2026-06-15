const DEFAULT_PRODUCTION_API = 'https://liberty-path-api.onrender.com/api/v1';

/**
 * Normalize API base URL so requests always hit /api/v1 (Vercel env may omit the suffix).
 */
export const getApiBaseUrl = () => {
  const raw = (
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_API : '/api/v1')
  ).trim();

  let base = raw.replace(/\/+$/, '');

  if (base.startsWith('http') && !/\/api\/v\d+$/i.test(base)) {
    base = `${base}/api/v1`;
  }

  if (process.env.NODE_ENV === 'production' && base.startsWith('http://')) {
    base = base.replace(/^http:\/\//i, 'https://');
  }

  return base;
};

export const getApiTimeoutMs = () =>
  parseInt(process.env.REACT_APP_API_TIMEOUT_MS || '15000', 10);

export const getBootstrapTimeoutMs = () =>
  parseInt(process.env.REACT_APP_BOOTSTRAP_TIMEOUT_MS || '12000', 10);
