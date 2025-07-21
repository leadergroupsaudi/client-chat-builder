import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const ProtectedRoute = () => {
  const { isAuthenticated, authFetch } = useAuth();

  const { data: currentUser, isLoading: isLoadingUser } = useQuery({
    queryKey: ['currentUser', isAuthenticated],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const response = await authFetch("http://localhost:8000/api/v1/users/me");
      if (!response.ok) {
        throw new Error("Failed to fetch current user");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (isLoadingUser) {
    return <div>Loading user data...</div>; // Or a spinner
  }

  // If authenticated but not an admin, redirect to client portal
  if (isAuthenticated && currentUser && !currentUser.is_admin) {
    return <Navigate to="/client-portal" />;
  }

  return <Outlet />;
};
