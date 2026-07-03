import { useState, useCallback } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaGoogle, FaSpinner } from 'react-icons/fa';
import { useGoogleLogin } from '@react-oauth/google';

const ERROR_MESSAGES = {
  popup_closed: 'Sign-in window was closed before completion.',
  popup_blocked: 'Pop-up was blocked. Please allow pop-ups for this site and try again.',
  access_denied: 'Access was denied. Please choose a different Google account.',
  popup_failed_to_open: 'Could not open sign-in window. Check your browser settings.',
  imediate_failed: 'Auto sign-in failed. Please try the manual sign-in button.',
  unknown: 'Google login failed. Please try again or use email login.',
};

const STATUS = { IDLE: 'idle', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' };

const GoogleAuthButton = ({ onSuccess, onError, isLoading, type = 'signin' }) => {
  const [status, setStatus] = useState(STATUS.IDLE);

  const googleLoginHandler = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: (tokenResponse) => {
      setStatus(STATUS.SUCCESS);
      if (tokenResponse?.access_token) {
        onSuccess?.({ credential: tokenResponse.access_token });
      }
    },
    onError: (error) => {
      const errorType = error?.type || 'unknown';
      const msg = ERROR_MESSAGES[errorType] || error?.message || ERROR_MESSAGES.unknown;
      setStatus(STATUS.ERROR);
      onError?.(new Error(msg));
      setTimeout(() => setStatus(STATUS.IDLE), 4000);
    },
  });

  const handleGoogleClick = useCallback(() => {
    if (isLoading || status === STATUS.LOADING) return;
    googleLoginHandler();
    setStatus(STATUS.LOADING);
  }, [isLoading, status, googleLoginHandler]);

  const busy = isLoading || status === STATUS.LOADING;

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={busy}
      className={`flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 font-semibold transition-all ${
        status === STATUS.ERROR
          ? 'border-red-400/50 bg-red-500/10 text-red-100'
          : status === STATUS.SUCCESS
            ? 'border-green-400/50 bg-green-500/10 text-green-100'
            : 'border-white/10 bg-white text-gray-900 hover:border-white/40 hover:shadow-lg dark:bg-[#111118] dark:text-white'
      }`}
      aria-label="Continue with Google"
    >
      {busy ? (
        <FaSpinner className="animate-spin text-[#4285f4]" size={18} />
      ) : status === STATUS.SUCCESS ? (
        <FaCheckCircle className="text-green-500" size={18} />
      ) : status === STATUS.ERROR ? (
        <FaExclamationTriangle className="text-red-500" size={18} />
      ) : (
        <FaGoogle className="text-[#4285f4]" size={18} />
      )}
      <span className="text-sm">
        {busy ? 'Connecting...' : status === STATUS.ERROR ? 'Failed' : `Continue with Google`}
      </span>
    </button>
  );
};

export default GoogleAuthButton;
