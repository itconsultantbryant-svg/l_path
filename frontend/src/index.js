import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './utils/axiosSetup';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Reliability: disable service worker to avoid stale cached bundles
// causing "keeps loading"/connectivity issues after deployments.
serviceWorkerRegistration.unregister();

