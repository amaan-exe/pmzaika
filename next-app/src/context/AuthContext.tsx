'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';

import { firebaseAuth } from '@/lib/firebase/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  signIn: (email: string, password: string, createAccount: boolean) => Promise<void>;
  signOutUser: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const auth = firebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (typeof document !== 'undefined') {
        if (nextUser) {
          try {
            const token = await nextUser.getIdToken();
            document.cookie = `pm_user_token=${token}; path=/; max-age=3600; SameSite=Lax`;
          } catch {}
        } else {
          document.cookie = 'pm_user_token=; path=/; max-age=0; SameSite=Lax';
        }
      }
    });
  }, []);

  const signIn = async (email: string, password: string, createAccount: boolean) => {
    const auth = firebaseAuth();
    if (!auth) {
      throw new Error('Customer login is not configured. Please contact the restaurant.');
    }

    if (createAccount) {
      await createUserWithEmailAndPassword(auth, email, password);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    setIsAuthOpen(false);
  };

  const signOutUser = async () => {
    const auth = firebaseAuth();
    if (auth) await signOut(auth);
    if (typeof document !== 'undefined') {
      document.cookie = 'pm_user_token=; path=/; max-age=0; SameSite=Lax';
    }
  };

  const getIdToken = async () => {
    if (!user) throw new Error('Please sign in before placing an order.');
    try {
      return await user.getIdToken(true);
    } catch {
      return user.getIdToken();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthOpen,
        openAuth: () => setIsAuthOpen(true),
        closeAuth: () => setIsAuthOpen(false),
        signIn,
        signOutUser,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
