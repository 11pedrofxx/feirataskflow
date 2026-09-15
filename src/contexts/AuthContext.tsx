import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { registerUser, resendCode, verifyCode } from '@/lib/auth.functions';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  passwordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  sendOtp: (email: string) => Promise<{ error: string | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
        }
        setLoading(false);
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === 'Email not confirmed') {
        return { error: 'E-mail não verificado. Verifique sua caixa de entrada.' };
      }
      if (error.message === 'Invalid login credentials') {
        return { error: 'E-mail ou senha incorretos.' };
      }
      return { error: error.message };
    }
    return { error: null };
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await registerUser({ data: { email, password, name } });
      if (!result.ok) return { error: result.error ?? 'Não foi possível criar a conta.' };
      return { error: null };
    } catch (err) {
      console.error('registerUser failed:', err);
      return { error: err instanceof Error ? err.message : 'Não foi possível criar a conta.' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message ?? null };
  };

  const sendOtp = async (email: string) => {
    try {
      const result = await resendCode({ data: { email } });
      if (!result.ok) return { error: result.error ?? 'Não foi possível enviar o código.' };
      return { error: null };
    } catch (err) {
      console.error('resendCode failed:', err);
      return { error: err instanceof Error ? err.message : 'Não foi possível enviar o código.' };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const result = await verifyCode({ data: { email, code: token } });
      if (!result.ok) return { error: result.error ?? 'Não foi possível verificar o código.' };
      return { error: null };
    } catch (err) {
      console.error('verifyCode failed:', err);
      return { error: err instanceof Error ? err.message : 'Não foi possível verificar o código.' };
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const clearPasswordRecovery = () => {
    setPasswordRecovery(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        passwordRecovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        sendOtp,
        verifyOtp,
        updatePassword,
        clearPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
