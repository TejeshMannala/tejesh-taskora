import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './redux/store.js'
import { AcademicProvider } from './contexts/AcademicContext.jsx'
import { SocketProvider } from './contexts/SocketContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import './index.css'
import App from './App.jsx'

// Register Service Worker (production only — dev server bypasses SW cache)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'ALARM_PERSISTENT') {
      window.dispatchEvent(new CustomEvent('alarm:persistent', { detail: event.data }));
    }
  });
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here';

console.log('[Auth] VITE_GOOGLE_CLIENT_ID present:', !!import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log('[Auth] VITE_API_URL:', import.meta.env.VITE_API_URL || 'http://localhost:5000');

let diagCount = 0;
window.__GOOGLE_DIAG = setInterval(() => {
  console.log('[GIS] window.google:', typeof window.google);
  console.log('[GIS] window.google?.accounts:', !!window.google?.accounts);
  console.log('[GIS] window.google?.accounts?.id:', !!window.google?.accounts?.id);
  console.log('[GIS] window.google?.accounts?.oauth2:', !!window.google?.accounts?.oauth2);
  if (++diagCount >= 3) { clearInterval(window.__GOOGLE_DIAG); delete window.__GOOGLE_DIAG; }
}, 3000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <GoogleOAuthProvider clientId={googleClientId}>
          <BrowserRouter>
            <SocketProvider>
              <AcademicProvider>
                <App />
              </AcademicProvider>
            </SocketProvider>
          </BrowserRouter>
        </GoogleOAuthProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
)
