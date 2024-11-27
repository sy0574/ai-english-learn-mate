import { BookOpen, Home, Book, MessageCircle, BarChart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
}

const navigationItems = [
  { icon: Home, label: '首页', path: '/' },
  { icon: BarChart, label: '学情', path: '/progress' },
  { icon: Book, label: '课程', path: '/courses' },
  { icon: MessageCircle, label: 'AI学伴', path: '/ai-assistant' },
  { icon: Settings, label: '设置', path: '/settings' }
];

export default function Sidebar({ isOpen }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className={cn(
        "flex h-14 items-center border-b px-4",
        isOpen ? "" : "justify-center"
      )}>
        <BookOpen className="h-6 w-6 text-primary" />
        {isOpen && (
          <h1 className="ml-3 text-lg font-semibold">
            LearnMate
          </h1>
        )}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Button
              key={item.label}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                !isOpen && "justify-center px-2",
                isActive && "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn(
                "h-4 w-4",
                isOpen && "mr-3",
                isActive && "text-primary"
              )} />
              {isOpen && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}