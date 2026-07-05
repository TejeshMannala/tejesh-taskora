import { useEffect, lazy, Suspense } from 'react';
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

const Home = lazy(() => import('./pages/Home/index'));
const Tasks = lazy(() => import('./pages/Tasks/index'));
const Reminders = lazy(() => import('./pages/Reminders/index'));
const Notifications = lazy(() => import('./pages/Notifications/index'));
const Profile = lazy(() => import('./pages/Profile/index'));
const Settings = lazy(() => import('./pages/Settings/index'));
const Subjects = lazy(() => import('./pages/Subjects/index'));

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
            <Route path="/home" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Home /></ErrorBoundary></Suspense>} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/tasks" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Tasks /></ErrorBoundary></Suspense>} />
            <Route path="/reminders" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Reminders /></ErrorBoundary></Suspense>} />
            <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Notifications /></ErrorBoundary></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Profile /></ErrorBoundary></Suspense>} />
            <Route path="/settings" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Settings /></ErrorBoundary></Suspense>} />
            <Route path="/subjects" element={<Suspense fallback={<PageLoader />}><ErrorBoundary><Subjects /></ErrorBoundary></Suspense>} />
            <Route path="/calendar" element={<Navigate to="/tasks" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  </div>
);

export default App;
