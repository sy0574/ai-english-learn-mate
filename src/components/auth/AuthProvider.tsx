import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('=== AUTH INIT START ===');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          console.log('Session found, user ID:', session.user.id);
          setUser(session.user);
        } else {
          console.log('No session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        toast.error('初始化认证状态失败');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== AUTH STATE CHANGE ===');
      console.log('Event:', event);
      console.log('Session user:', session?.user?.id);

      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.id);
        toast.success('登录成功');
        navigate('/courses');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        toast.success('已退出登录');
      } else if (event === 'USER_UPDATED') {
        console.log('User updated:', session?.user?.id);
        toast.success('用户信息已更新');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('登录错误:', error);
          throw error;
        }

        if (!data.user) {
          throw new Error('登录失败，未获取到用户信息');
        }

        // 登录成功的处理会在 onAuthStateChange 中完成
      } catch (error) {
        console.error('登录错误:', error);
        const message = getAuthErrorMessage(error);
        toast.error(message);
        throw error;
      }
    },
    signUp: async (email: string, password: string) => {
      try {
        // 验证输入
        if (!email || !password) {
          throw new Error('请输入邮箱和密码');
        }

        if (password.length < 6) {
          throw new Error('密码至少需要6个字符');
        }

        // 注册用户
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

        if (error) {
          console.error('注册错误:', error);
          throw error;
        }
        
        if (!data?.user?.id) {
          console.error('注册失败: 未获取到用户ID');
          throw new Error('注册失败，请重试');
        }

        // 检查用户是否需要验证邮箱
        if (data?.user?.identities?.length === 0) {
          toast.error('该邮箱已被注册，请直接登录');
          return;
        }

        console.log('注册成功，用户ID:', data.user.id);
        toast.success('注册成功！请查收验证邮件');

      } catch (error) {
        console.error('注册错误:', error);
        const message = getAuthErrorMessage(error);
        toast.error(message);
        throw error;
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        const message = getAuthErrorMessage(error);
        console.error('Auth error:', { error, message });
        toast.error(message);
        throw error;
      }
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
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

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
        return '密码至少需要6个字符';
      case 'Email rate limit exceeded':
        return '登录尝试次数过多，请稍后再试';
      case 'Database error saving new user':
        return '注册失败，请稍后重试';
      default:
        if (authError.message?.includes('credentials')) return '邮箱或密码错误';
        if (authError.message?.includes('confirmed')) return '请先验证邮箱';
        return authError.message || '操作失败，请重试';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请重试';
}