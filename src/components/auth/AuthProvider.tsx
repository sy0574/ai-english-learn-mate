import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SMSService } from '@/lib/services/sms-service';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithPhone: (phone: string, code: string) => Promise<void>;
  signUpWithPhone: (phone: string) => Promise<void>;
  sendVerificationCode: (phone: string) => Promise<{ success: boolean; message: string }>;
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
  const smsService = SMSService.getInstance();
  const navigate = useNavigate();

  useEffect(() => {
    // 初始化认证状态
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

    // 监听认证状态变化
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
        // 检查是否是首次登录
        if (session?.user?.user_metadata?.created_at === session?.user?.created_at) {
          // 如果是新用户首次登录，设置为免费版
          localStorage.setItem('subscription_tier', 'free');
        }
        toast.success('登录成功');
        setTimeout(() => {
          navigate('/courses');
        }, 100); // 添加一个小延迟确保状态更新完成
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
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('登录失败，未获取到用户信息');

      } catch (error) {
        const message = getAuthErrorMessage(error);
        console.error('Auth error:', { error, message });
        toast.error(message);
        throw error;
      }
    },
    signUp: async (email: string, password: string) => {
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

        localStorage.setItem('subscription_tier', 'free');
        toast.success('注册成功！请查收验证邮件');

      } catch (error) {
        const message = getAuthErrorMessage(error);
        console.error('Auth error:', { error, message });
        toast.error(message);
        throw error;
      }
    },
    signInWithPhone: async (phone: string, code: string) => {
      try {
        // 验证验证码
        const verifyResult = await smsService.verifyCode(phone, code);
        if (!verifyResult.success) {
          throw new Error(verifyResult.message);
        }

        // 使用手机号登录或注册
        const { data: { user }, error } = await supabase.auth.signUp({
          email: `${phone}@phone.user`, // 使用手机号生成唯一邮箱
          password: code, // 使用验证码作为临时密码
          options: {
            data: {
              phone,
              created_at: new Date().toISOString(),
            }
          }
        });

        if (error) {
          // 如果用户已存在，尝试登录
          if (error.message.includes('already registered')) {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
              email: `${phone}@phone.user`,
              password: code,
            });

            if (signInError) throw signInError;
            if (!data.user) throw new Error('登录失败，请重试');
          } else {
            throw error;
          }
        }

        // 如果是新用户，设置为免费版
        if (user?.user_metadata?.created_at === user?.created_at) {
          localStorage.setItem('subscription_tier', 'free');
        }

        toast.success('登录成功');
      } catch (error) {
        const message = getAuthErrorMessage(error);
        console.error('Phone auth error:', { error, message });
        toast.error(message);
        throw error;
      }
    },
    signUpWithPhone: async (phone: string) => {
      try {
        // 发送验证码
        const result = await smsService.sendVerificationCode(phone);
        if (!result.success) {
          throw new Error(result.message);
        }
        toast.success(result.message);
      } catch (error) {
        const message = getAuthErrorMessage(error);
        console.error('Phone signup error:', { error, message });
        toast.error(message);
        throw error;
      }
    },
    sendVerificationCode: async (phone: string) => {
      return await smsService.sendVerificationCode(phone);
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
        return '手机号或验证码错误';
      case 'Email not confirmed':
        return '请先验证邮箱';
      case 'User already registered':
        return '该手机号已被注册';
      case 'Password should be at least 6 characters':
        return '验证码格式错误';
      case 'Email rate limit exceeded':
        return '登录尝试次数过多，请稍后再试';
      case 'Phone number format is invalid':
        return '手机号格式无效';
      case 'Unable to validate phone number':
        return '无法验证手机号';
      case 'SMS code has expired':
        return '验证码已过期';
      default:
        if (authError.message?.includes('credentials')) return '手机号或验证码错误';
        if (authError.message?.includes('confirmed')) return '请先验证手机号';
        if (authError.message?.includes('authorized')) return '该手机号未授权';
        return authError.message || '操作失败，请重试';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '操作失败，请重试';
}