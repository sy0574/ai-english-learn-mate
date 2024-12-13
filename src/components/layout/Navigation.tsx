'use client';

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { AdminManager } from '@/lib/api/adminManager';
import { AdminRole } from '@/lib/types/admin';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Navigation() {
  const location = useLocation();
  const { user } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      setIsLoading(true);
      try {
        if (user?.id) {
          console.log('=== Checking admin role for user ===', user.id);
          const adminManager = AdminManager.getInstance();
          const role = await adminManager.getCurrentAdminRole();
          console.log('=== Admin role check result ===', role);
          
          if (isMounted) {
            setAdminRole(role);
          }
        } else {
          console.log('=== No user ID, clearing admin role ===');
          if (isMounted) {
            setAdminRole(null);
          }
        }
      } catch (error) {
        console.error('=== Error checking admin role ===', error);
        if (isMounted) {
          setAdminRole(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const navItems = [
    { path: '/', label: '首页' },
    { path: '/courses', label: '课程' },
    { path: '/progress', label: '学习进度' },
    { path: '/ai-assistant', label: 'AI助手' },
    { path: '/member-center', label: '会员中心' },
    { path: '/settings', label: '设置' },
  ];

  // 如果用户有管理员权限，添加管理后台入口
  if (!isLoading && adminRole) {
    console.log('=== Adding admin route for role ===', adminRole);
    navItems.push({ path: '/admin', label: '管理后台' });
  }

  return (
    <nav className="flex items-center space-x-4">
      {navItems.map((item) => (
        <Link key={item.path} to={item.path}>
          <Button
            variant="ghost"
            className={cn(
              'hover:bg-accent hover:text-accent-foreground',
              location.pathname === item.path && 'bg-accent text-accent-foreground'
            )}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
} 