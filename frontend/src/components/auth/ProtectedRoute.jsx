import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProfile } from '../../redux/slices/authSlice';

const ProtectedRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
