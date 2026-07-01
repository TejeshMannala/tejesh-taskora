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

// Register Service Worker
if ('serviceWorker' in navigator) {
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
