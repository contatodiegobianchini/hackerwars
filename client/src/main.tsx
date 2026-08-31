import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './socketRuntimeBridges.js';

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://hackerwars-api.onrender.com').replace(/\/$/, '');
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || BACKEND_URL).replace(/\/$/, '');

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    return originalFetch(`${BACKEND_URL}${input}`, init);
  }
  if (input instanceof URL && input.pathname.startsWith('/api/')) {
    return originalFetch(`${BACKEND_URL}${input.pathname}${input.search}`, init);
  }
  if (input instanceof Request) {
    const url = new URL(input.url);
    if (url.pathname.startsWith('/api/')) {
      return originalFetch(new Request(`${BACKEND_URL}${url.pathname}${url.search}`, input), init);
    }
  }
  return originalFetch(input, init);
};

const NativeWebSocket = window.WebSocket;
const backendOrigin = new URL(SOCKET_URL).origin;

class RoutedWebSocket extends NativeWebSocket {
  constructor(url: string | URL, protocols?: string | string[]) {
    const parsed = new URL(url.toString(), window.location.href);
    if (parsed.origin === window.location.origin && parsed.pathname.startsWith('/socket.io')) {
      parsed.protocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      parsed.host = new URL(backendOrigin).host;
    }
    super(parsed.toString(), protocols);
  }
}

window.WebSocket = RoutedWebSocket;

import('./App.js').then(({ default: App }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
