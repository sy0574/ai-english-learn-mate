import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getAuthErrorMessage(error: AuthError | Error | unknown): string {
  if (!error) return '发生未知错误';

  if (error instanceof Error && 'status' in error) {
    const authError = error as AuthError;
    switch (authError.message) {
      case 'Invalid login credentials':
        return '邮箱或密码错误';
      case 'Email not confirmed':
        return '请先验证邮箱';
      case 'User already registered':
        return '该邮箱已被注册';
      case 'Password should be at least 6 characters':
        return '密码长度至少为6位';
      case 'Email rate limit exceeded':
        return '登录尝试次数过多，请稍后再试';
      default:
        if (authError.message?.includes('credentials')) return '邮箱或密码错误';
        if (authError.message?.includes('confirmed')) return '请先验证邮箱';
        if (authError.message?.includes('authorized')) return '该邮箱未授权';
        return authError.message || '操作失败，请重试';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请重试';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化认证状态
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast.error('初始化认证状态失败');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === 'SIGNED_IN') {
        toast.success('登录成功');
      } else if (event === 'SIGNED_OUT') {
        toast.success('已退出登录');
      } else if (event === 'USER_UPDATED') {
        toast.success('用户信息已更新');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: unknown): never => {
    const message = getAuthErrorMessage(error);
    console.error('Auth error:', { error, message });
    toast.error(message);
    throw new Error(message);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('登录失败，未获取到用户信息');

    } catch (error) {
      handleAuthError(error);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            created_at: new Date().toISOString(),
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('注册失败，请重试');

      toast.success('注册成功！请查收验证邮件');

    } catch (error) {
      handleAuthError(error);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleAuthError(error);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}