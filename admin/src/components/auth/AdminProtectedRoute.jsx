import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminProtectedRoute = () => {
  const { isAuthenticated, user } = useSelector((state) => state.adminAuth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
        <div className="glass-card p-12 max-w-lg text-center">
          <div className="text-6xl mb-6">❌</div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 text-lg mb-8">
            You are not an administrator.
          </p>
          <Navigate to="/login" replace />
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
