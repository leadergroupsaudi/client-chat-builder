import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // This logic assumes that you want to redirect non-admins away from the main dashboard routes.
  // Adjust the condition based on your application's specific routing rules.
  // For example, if you are on a route that is NOT the client portal, and you are not an admin, redirect.
  if (window.location.pathname.startsWith('/dashboard') && user && !user.is_admin) {
    return <Navigate to="/client-portal" replace />;
  }


  return <Outlet />;
};
