import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@/types';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
      if (token) {
        try {
          const response = await api.get('/auth/profile');
          type BackendUser = Omit<User, 'role'> & { isAdmin?: boolean };
const backendUser = response.data.user as BackendUser;
setUser(backendUser ? { ...backendUser, role: backendUser.isAdmin ? 'admin' : 'user' } : null);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('admin_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { token, admin_token, user: rawUser } = response.data;
type BackendUser = Omit<User, 'role'> & { isAdmin?: boolean };
const backendUser = rawUser as BackendUser;
const user: User | null = backendUser ? { ...backendUser, role: backendUser.isAdmin ? 'admin' : 'user' } as User : null;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      if (admin_token) {
        localStorage.setItem('admin_token', admin_token);
      }
      
      setUser(user);
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await api.post<AuthResponse>('/auth/register', userData);
      const { token, user: rawUser } = response.data;
type BackendUser = Omit<User, 'role'> & { isAdmin?: boolean };
const backendUser = rawUser as BackendUser;
const user: User | null = backendUser ? { ...backendUser, role: backendUser.isAdmin ? 'admin' : 'user' } as User : null;
      
      if (token) {
        localStorage.setItem('token', token);
      }
      
      setUser(user);
      toast({
        title: "Registration Successful",
        description: `Welcome to DigiWallet, ${user.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "Registration failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};