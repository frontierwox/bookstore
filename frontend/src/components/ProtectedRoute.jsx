import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { IoLockClosed } from 'react-icons/io5';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  const { isAdminAuthenticated, adminUser, loading: adminLoading } = useContext(AdminAuthContext);
  const location = useLocation();

  if (adminOnly) {
    if (adminLoading) return <div className="loading-container"><div className="spinner"></div></div>;
    
    if (!isAdminAuthenticated) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    
    return children;
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
