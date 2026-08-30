import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://hackerwars-api.onrender.com').replace(/\/$/, '');

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return originalFetch(`${BACKEND_URL}${input}`, init);
  }
  if (input instanceof URL && input.pathname.startsWith('/api/')) {
    return originalFetch(new URL(input.pathname + input.search, `${BACKEND_URL}/`).toString(), init);
  }
  if (input instanceof Request && input.url.includes('/api/')) {
    const url = new URL(input.url);
    if (url.pathname.startsWith('/api/')) {
      return originalFetch(new Request(`${BACKEND_URL}${url.pathname}${url.search}`, input), init);
    }
  }
  return originalFetch(input, init);
};

import('./App.js').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
