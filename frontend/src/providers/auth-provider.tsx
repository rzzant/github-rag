'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { api, ApiError } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  email: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bootstrap: ask the backend whether the current session cookie (if any)
  // is still valid. This is the source of truth - the cookie itself is
  // httpOnly, so the frontend can never inspect it directly.
  useEffect(() => {
    let cancelled = false;
    api.auth
      .me()
      .then((data) => {
        if (cancelled) return;
        setIsAuthenticated(true);
        setEmail(data.email);
      })
      .catch(() => {
        if (cancelled) return;
        setIsAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call anywhere in the app that gets a 401 (session expired,
  // cookie invalidated, etc.) dispatches this event - centralizes "log the
  // user out" in one place instead of every component handling it itself.
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setEmail(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (loginEmail: string, password: string) => {
    setError(null);
    try {
      const data = await api.auth.login(loginEmail, password);
      setIsAuthenticated(true);
      setEmail(data.email);
    } catch (err) {
      setIsAuthenticated(false);
      setError(err instanceof ApiError ? err.message : 'Login failed');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      // Clear client state regardless of whether the request succeeded -
      // if the network call failed, the user still expects to be logged
      // out locally, and the cookie will simply expire on its own (7d TTL).
      setIsAuthenticated(false);
      setEmail(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, email, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
