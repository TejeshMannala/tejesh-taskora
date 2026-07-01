import { Component } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="glass-card max-w-md w-full p-8 text-center">
            <div className="text-5xl mb-6 flex justify-center">
              <FaExclamationTriangle className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Something went wrong</h2>
            <p className="text-gray-400 mb-2">
              The application encountered an unexpected error.
            </p>
            <p className="text-gray-500 text-sm mb-8 font-mono bg-white/5 p-3 rounded-lg break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-accent text-white font-medium transition-all"
              >
                <FaRedo /> Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
              >
                <FaHome /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;