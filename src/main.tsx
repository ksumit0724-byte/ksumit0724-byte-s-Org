import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR/WebSocket errors that are expected in this environment
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.message?.includes('WebSocket') || event.reason?.message?.includes('vite')) {
      event.preventDefault();
    }
  });

  // Catch the "WebSocket closed without opened" specific error
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('[vite] failed to connect') || args[0]?.includes?.('WebSocket')) {
      return;
    }
    originalError.apply(console, args);
  };
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Unregister any old service workers to clear stale caches
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });

    navigator.serviceWorker.register('/sw.js').then(() => {
      // Quiet SW initialized log
    }).catch(() => {
      // Quiet SW error
    });
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
