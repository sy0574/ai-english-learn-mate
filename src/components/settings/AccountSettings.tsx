'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { AdminManager } from '@/lib/api/adminManager';
import { AdminRole } from '@/lib/types/admin';
import { Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountSettings() {
  const { user, signOut } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user?.id) {
        try {
          const adminManager = AdminManager.getInstance();
          const role = await adminManager.getCurrentAdminRole();
          setAdminRole(role);
        } catch (error) {
          console.error('Error checking admin role:', error);
          setAdminRole(null);
        }
      }
    };

    checkAdminRole();
  }, [user?.id]);

  if (!user) return null;

  const formatDate = (date: string | undefined) => {
    if (!date) return '未知';
    return new Date(date).toLocaleString('zh-CN');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('退出登录成功');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('退出登录失败');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>账户信息</CardTitle>
          <CardDescription>查看和管理您的账户信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>邮箱</Label>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>

          <div className="space-y-2">
            <Label>账户创建时间</Label>
            <div className="text-sm text-muted-foreground">
              {formatDate(user.created_at)}
            </div>
          </div>

          <div className="space-y-2">
            <Label>上次更新时间</Label>
            <div className="text-sm text-muted-foreground">
              {formatDate(user.updated_at)}
            </div>
          </div>

          {adminRole && (
            <div className="pt-4 border-t">
              <Label>管理员功能</Label>
              <div className="mt-2">
                <Link to="/admin">
                  <Button variant="outline" className="w-full gap-2">
                    <Settings className="w-4 h-4" />
                    进入管理后台
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 