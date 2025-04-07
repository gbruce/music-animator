import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (token) {
          const userData = await authApi.getProfile();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        authApi.logout();
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };

  const signup = async (email: string, username: string, password: string) => {
    const response = await authApi.signup({ email, username, password });
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    token,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 