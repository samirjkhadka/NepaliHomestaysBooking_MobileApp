import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './api';
import { api } from './api';

const TOKEN_KEY = 'nepali_homestays_token';
const USER_KEY = 'nepali_homestays_user';

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ requireOtp?: boolean; email?: string } | void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signup: (body: { email: string; password: string; name: string; phone: string; role?: 'guest' | 'host' }) => Promise<void>;
  logout: () => Promise<void>;
  setUserAndToken: (user: User, token: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setUserAndToken = useCallback(async (u: User, t: string) => {
    setUser(u);
    setToken(t);
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, t),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(u)),
    ]);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      if (res.requireOtp) {
        return { requireOtp: true, email: res.email ?? email };
      }
      if (res.token && res.user) {
        await setUserAndToken(res.user, res.token);
      }
    },
    [setUserAndToken]
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string) => {
      const res = await api.verify({ email, otp });
      if (res.token && res.user) {
        await setUserAndToken(res.user, res.token);
      }
    },
    [setUserAndToken]
  );

  const signup = useCallback(
    async (body: { email: string; password: string; name: string; phone: string; role?: 'guest' | 'host' }) => {
      await api.signup(body);
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyOtp, signup, logout, setUserAndToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
