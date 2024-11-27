import { useAuth } from './AuthProvider';
import LoginPage from '@/components/auth/LoginPage';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <>{children}</>;
}