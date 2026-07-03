import { useState, useEffect, useCallback } from 'react';
import { FaExclamationTriangle, FaCheckCircle, FaTimes, FaSyncAlt } from 'react-icons/fa';
import { checkBackendHealth } from '../../services/api';

const STATUS_POLL_INTERVAL = 15000;

const BackendStatusBanner = () => {
  const [status, setStatus] = useState({ reachable: true, healthy: true, mode: 'normal' });
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    const result = await checkBackendHealth();
    setStatus(result);
    if (result.reachable && result.healthy) {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, STATUS_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [check]);

  if (dismissed) return null;
  if (status.reachable && status.healthy) return null;

  const isDown = !status.reachable;
  const isDegraded = status.reachable && !status.healthy;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] ${isDown ? 'bg-red-600/90' : 'bg-amber-600/90'} backdrop-blur-sm`}>
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-sm">
          {isDown ? (
            <>
              <FaExclamationTriangle className="shrink-0" />
              <span>Backend server is unreachable. Please ensure the server is running on port 5000.</span>
            </>
          ) : (
            <>
              <FaExclamationTriangle className="shrink-0" />
              <span>Backend database is connecting — some features may be temporarily unavailable.</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={check}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all"
            title="Retry connection"
          >
            <FaSyncAlt size={12} />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all"
            title="Dismiss"
          >
            <FaTimes size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackendStatusBanner;
