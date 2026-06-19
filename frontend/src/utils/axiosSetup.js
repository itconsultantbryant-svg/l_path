import axios from 'axios';
import {
  DIRECT_RENDER_API,
  getApiBaseUrl,
  getApiTimeoutMs,
  getWarmupTimeoutMs
} from './apiConfig';

const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1200;

export const isRetryableNetworkError = (error) => {
  if (error?.response?.status === 429) return true;
  if (error?.response) return false;

  const code = error?.code || '';
  const message = error?.message || '';
  return (
    ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'ERR_NETWORK'].includes(code) ||
    /Network Error|Failed to fetch|timeout/i.test(message)
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const setupAxios = () => {
  const baseURL = getApiBaseUrl();
  axios.defaults.baseURL = baseURL;
  axios.defaults.timeout = getApiTimeoutMs();

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      if (!config) return Promise.reject(error);

      const method = (config.method || 'get').toLowerCase();
      const retryCount = config.__retryCount || 0;

      if (
        !config.__directFallbackTried &&
        isRetryableNetworkError(error) &&
        (config.baseURL === '/api/v1' || config.baseURL === getApiBaseUrl())
      ) {
        config.__directFallbackTried = true;
        config.baseURL = DIRECT_RENDER_API;
        return axios(config);
      }

      if (!RETRYABLE_METHODS.has(method) || !isRetryableNetworkError(error) || retryCount >= MAX_RETRIES) {
        return Promise.reject(error);
      }

      config.__retryCount = retryCount + 1;
      await sleep(RETRY_BASE_DELAY_MS * config.__retryCount);
      return axios(config);
    }
  );
};

/** Wake Render before login/dashboard — helps all carriers on cold start. */
export const warmupApi = async () => {
  const timeout = getWarmupTimeoutMs();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const attempts = [
    origin ? `${origin}/health` : null,
    'https://liberty-path-api.onrender.com/health'
  ].filter(Boolean);

  for (const url of attempts) {
    try {
      await axios.get(url, { timeout, baseURL: '' });
      return true;
    } catch {
      // try next endpoint
    }
  }

  return false;
};

setupAxios();
