'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminManager } from '@/lib/api/adminManager';
import { AdminRole } from '@/lib/types/admin';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: AdminRole;
}

export default function AdminGuard({ children, requiredRole }: AdminGuardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const adminManager = AdminManager.getInstance();
    const currentRole = await adminManager.getCurrentAdminRole();

    if (!currentRole) {
      navigate('/');
      return;
    }

    if (requiredRole) {
      // 如果需要特定角色
      if (
        requiredRole === 'super_admin' && currentRole !== 'super_admin' ||
        requiredRole === 'admin' && !['admin', 'super_admin'].includes(currentRole)
      ) {
        navigate('/');
        return;
      }
    }

    setHasAccess(true);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin">Loading...</div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
} 