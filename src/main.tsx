import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle and suppress benign Vite HMR / WebSocket connection errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason || '');
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') || 
      message.includes('web socket') ||
      message.includes('HMR')
    ) {
      event.preventDefault();
      console.debug('Suppressed benign environment WebSocket/HMR rejection:', reason);
    }
  });

  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('WebSocket') || 
      message.includes('websocket') || 
      message.includes('web socket') ||
      message.includes('HMR')
    ) {
      event.preventDefault();
      console.debug('Suppressed benign environment WebSocket/HMR error:', message);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

