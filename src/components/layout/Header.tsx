import { ChevronLeft, ChevronRight, Moon, Sun, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { PRICING_PLANS } from '@/lib/types/subscription';
import { useSubscription } from '@/hooks/useSubscription';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { theme: _theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const { currentTier } = useSubscription();
  const currentPlan = PRICING_PLANS[currentTier];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已退出登录');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '退出登录失败，请重试';
      console.error('Logout error:', error);
      toast.error(errorMessage);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <h2 className="text-xl font-semibold">AI智学👫</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/member-center">
            <Button variant="outline" className="gap-2">
              <Crown className="w-4 h-4" />
              <span>{currentPlan.name}</span>
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                浅色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                深色
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                系统
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                退出登录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}