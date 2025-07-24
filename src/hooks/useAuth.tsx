import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const currentToken = localStorage.getItem('accessToken');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('accessToken');
      navigate('/login');
      throw new Error('Unauthorized');
    }

    return response;
  }, [navigate]);

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await authFetch('/api/v1/users/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid
            throw new Error('Invalid token');
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
          setToken(null);
          localStorage.removeItem('accessToken');
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [authFetch]);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('accessToken', newToken);
    setIsLoading(true); // Start loading user info
    const loadUser = async () => {
        try {
          const response = await authFetch('/api/v1/users/me');
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            throw new Error('Invalid token');
          }
        } catch (error) {
          console.error("Failed to fetch user on login", error);
          setToken(null);
          localStorage.removeItem('accessToken');
        } finally {
            setIsLoading(false);
        }
      };
    loadUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    navigate('/login');
  };

  const value = {
    isAuthenticated: !!token && !!user,
    token,
    user,
    isLoading,
    login,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
