import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SBUser, SBAuthState, SBAuthConfig } from '../types/auth';

interface SBAuthContextType extends SBAuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SBAuthContext = createContext<SBAuthContextType | null>(null);

interface SBAuthProviderProps {
  children: ReactNode;
  config: SBAuthConfig;
  apiBasePath?: string;
}

export function SBAuthProvider({ 
  children, 
  config, 
  apiBasePath = '/api' 
}: SBAuthProviderProps) {
  const [state, setState] = useState<SBAuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setUser = (user: SBUser | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null,
    }));
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBasePath}/user`);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        setUser(null);
      } else {
        throw new Error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Auth refresh error:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBasePath}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        const errorData = await response.text();
        setError(errorData || 'Login failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiBasePath}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        const errorData = await response.text();
        setError(errorData || 'Registration failed');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${apiBasePath}/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  // 앱 시작 시 사용자 상태 확인
  useEffect(() => {
    refreshUser();
  }, []);

  const contextValue: SBAuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <SBAuthContext.Provider value={contextValue}>
      {children}
    </SBAuthContext.Provider>
  );
}

export function useSBAuth(): SBAuthContextType {
  const context = useContext(SBAuthContext);
  if (!context) {
    throw new Error('useSBAuth must be used within SBAuthProvider');
  }
  return context;
}