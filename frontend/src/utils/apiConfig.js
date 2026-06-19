/** Direct Render URL — used as fallback when same-origin proxy is unreachable. */
export const DIRECT_RENDER_API = 'https://liberty-path-api.onrender.com/api/v1';

/**
 * Production uses same-origin /api/v1 (proxied by Vercel → Render).
 * Avoids cross-origin calls to onrender.com, which some Liberian carriers block or resolve slowly.
 */
export const getApiBaseUrl = () => {
  const raw = (
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'production' ? '/api/v1' : '/api/v1')
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

/** 45s default — mobile networks (Orange/Lonestar) and Render cold starts need headroom. */
export const getApiTimeoutMs = () =>
  parseInt(process.env.REACT_APP_API_TIMEOUT_MS || '45000', 10);

export const getBootstrapTimeoutMs = () =>
  parseInt(process.env.REACT_APP_BOOTSTRAP_TIMEOUT_MS || '45000', 10);

export const getWarmupTimeoutMs = () =>
  parseInt(process.env.REACT_APP_WARMUP_TIMEOUT_MS || '60000', 10);
