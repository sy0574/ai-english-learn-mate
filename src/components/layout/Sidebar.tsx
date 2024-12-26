import { BookOpen, Home, Book, MessageCircle, BarChart, Settings, Library } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navigationItems = [
  { icon: Home, label: '首页', path: '/' },
  { icon: BarChart, label: '学情', path: '/progress' },
  { icon: Book, label: '课程', path: '/courses' },
  { icon: Library, label: '书库📚', path: '/courses/library' },
  { icon: MessageCircle, label: 'AI学伴', path: '/ai-assistant' },
  { icon: Settings, label: '设置', path: '/settings' }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside 
      className={cn(
        "group fixed left-0 top-0 z-50 h-screen border-r bg-background transition-all duration-300",
        isOpen ? "w-64" : "w-16",
        "hover:w-64"
      )}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className={cn(
        "flex h-14 items-center border-b px-4",
        isOpen ? "justify-start" : "justify-center",
        "group-hover:justify-start"
      )}>
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className={cn(
          "ml-3 text-lg font-semibold transition-opacity duration-300",
          !isOpen && "opacity-0 hidden group-hover:opacity-100 group-hover:block"
        )}>
        Learn Mate
        </h1>
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
                !isOpen && "justify-center px-2 group-hover:justify-start",
                isActive && "bg-primary/10 text-primary hover:bg-primary/20",
                item.label === '书库📚' && !isOpen && "pl-2",
                item.label === '书库📚' && (isOpen || document.querySelector(".group:hover")) && "pl-8"
              )}
              onClick={() => navigate(item.path)}
            >
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                (isOpen || document.querySelector(".group:hover")) && "mr-3",
                isActive && "text-primary",
                item.label === '书库📚' && "scale-90"
              )} />
              <span className={cn(
                "transition-opacity duration-300",
                !isOpen && "opacity-0 hidden group-hover:opacity-100 group-hover:block",
                item.label === '书库📚' && "text-sm text-muted-foreground"
              )}>{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}