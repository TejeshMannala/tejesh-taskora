import { useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaGoogle, FaSpinner } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';

const isValidClientId = (id) => {
  const trimmed = id?.trim();
  return Boolean(
    trimmed &&
    trimmed !== 'your_google_client_id_here' &&
    trimmed.length >= 20 &&
    trimmed.includes('.apps.googleusercontent.com')
  );
};

const getClientIdHelp = (clientId) => {
  const trimmed = clientId?.trim();

  if (!trimmed) {
    return {
      title: 'Google Login is not configured',
      detail: 'VITE_GOOGLE_CLIENT_ID is empty in frontend/.env.',
      action: 'Paste your real Google OAuth Web Client ID after VITE_GOOGLE_CLIENT_ID= and restart the frontend server.',
    };
  }

  if (trimmed === 'your_google_client_id_here') {
    return {
      title: 'Google Client ID is still a placeholder',
      detail: 'Google rejects placeholder IDs, so the account picker cannot open.',
      action: 'Replace it with the real Client ID from Google Cloud Console.',
    };
  }

  if (trimmed.length < 20) {
    return {
      title: 'Google Client ID looks incomplete',
      detail: 'A real Client ID is much longer and ends with .apps.googleusercontent.com.',
      action: 'Copy the full Client ID again from Google Cloud Console.',
    };
  }

  return {
    title: 'Google Client ID has the wrong format',
    detail: 'A Web application Client ID ends with .apps.googleusercontent.com.',
    action: 'Make sure you copied the OAuth Client ID, not the Client Secret or an API key.',
  };
};

const GoogleAuthButton = ({ onSuccess, onError, isLoading, type = 'signin' }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const valid = isValidClientId(clientId);
  const help = valid ? null : getClientIdHelp(clientId);
  const [buttonState, setButtonState] = useState('idle');

  const googleLoginHandler = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setButtonState('success');
      // Pass the access_token as 'credential' for the backend
      onSuccess?.({ credential: tokenResponse.access_token });
    },
    onError: (error) => {
      console.warn('Google login popup error:', error);
      setButtonState('error');
      onError?.(new Error('Google login failed or was cancelled.'));
      setTimeout(() => setButtonState('idle'), 3000);
    },
  });

  const handleGoogleClick = () => {
    if (!valid || isLoading || buttonState === 'loading') return;
    setButtonState('loading');
    googleLoginHandler();
  };

  // Reset loading state if parent finishes loading
  if (!isLoading && buttonState === 'loading') {
    setButtonState('idle');
  }

  if (!valid && help) {
    return (
      <div className="w-full rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-yellow-400" size={18} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-yellow-300">{help.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-100/80">{help.detail}</p>
            <p className="mt-1 text-xs leading-relaxed text-yellow-100/80">{help.action}</p>
          </div>
        </div>
      </div>
    );
  }

  const busy = isLoading || buttonState === 'loading';
  const label = type === 'signup' ? 'Sign up with Google' : 'Continue with Google';
  const busyLabel = type === 'signup' ? 'Creating account...' : 'Signing in...';

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={busy}
        className={`group relative flex min-h-[50px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl border px-4 py-3 font-semibold shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${
          buttonState === 'error'
            ? 'border-red-400/50 bg-red-500/10 text-red-100 animate-pulse'
            : buttonState === 'success'
              ? 'border-green-400/50 bg-green-500/10 text-green-100'
              : 'border-white/10 bg-white text-gray-900 hover:border-white/40 hover:shadow-[0_18px_45px_rgba(124,58,237,0.28)] dark:bg-[#111118] dark:text-white'
        }`}
        aria-label={label}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-[#4285f4]/0 via-[#34a853]/10 to-[#ea4335]/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm">
          {busy ? (
            <FaSpinner className="animate-spin text-[#4285f4]" size={17} />
          ) : buttonState === 'success' ? (
            <FaCheckCircle className="text-green-500" size={17} />
          ) : buttonState === 'error' ? (
            <FaExclamationTriangle className="text-red-500" size={17} />
          ) : (
            <FaGoogle className="text-[#4285f4]" size={17} />
          )}
        </span>
        <span className="relative text-sm">{busy ? busyLabel : label}</span>
      </button>
    </div>
  );
};

export default GoogleAuthButton;
