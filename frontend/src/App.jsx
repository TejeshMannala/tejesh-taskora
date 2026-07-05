import { useEffect } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import ErrorBoundary from './components/ui/ErrorBoundary';
import BackendStatusBanner from './components/ui/BackendStatusBanner';
import { fetchProfile } from './redux/slices/authSlice';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/Forgotpassword/forgotPassword';
import { AcademicProvider } from './contexts/AcademicContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AgreementPopup from './components/auth/AgreementPopup';
import AlarmOverlay from './components/alarm/AlarmOverlay';

import Home from './pages/Home/index';
import Tasks from './pages/Tasks/index';
import Reminders from './pages/Reminders/index';
import Notifications from './pages/Notifications/index';
import Profile from './pages/Profile/index';
import Settings from './pages/Settings/index';
import Subjects from './pages/Subjects/index';

import './index.css';

function App() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const needsAgreement = isAuthenticated && user && (user.isFirstLogin || !user.hasAcceptedAgreement);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [dispatch, isAuthenticated]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!googleClientId || googleClientId === 'your_google_client_id_here') {
    console.warn(
      'VITE_GOOGLE_CLIENT_ID is a placeholder or missing in frontend/.env. Google login will show a setup message until a real Client ID is added.'
    );
  }

  return (
    <div className="app-container bg-background min-h-screen text-white">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }} />
      <BackendStatusBanner />
      <AlarmOverlay />
      {needsAgreement && <AgreementPopup />}
      <Routes>
        <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
        <Route path="/login" element={<ErrorBoundary><LoginPage /></ErrorBoundary>} />
        <Route path="/signup" element={<ErrorBoundary><SignupPage /></ErrorBoundary>} />
        <Route path="/forgotten-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AcademicProvider><MainLayout /></AcademicProvider>}>
            <Route path="/home" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/tasks" element={<ErrorBoundary><Tasks /></ErrorBoundary>} />
            <Route path="/reminders" element={<ErrorBoundary><Reminders /></ErrorBoundary>} />
            <Route path="/notifications" element={<ErrorBoundary><Notifications /></ErrorBoundary>} />
            <Route path="/profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
            <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            <Route path="/subjects" element={<ErrorBoundary><Subjects /></ErrorBoundary>} />
            <Route path="/calendar" element={<Navigate to="/tasks" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
