'use client';

import { useAuth } from '../auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function AccountSettings() {
  const { user } = useAuth();

  if (!user) return null;

  const formatDate = (date: string | undefined) => {
    if (!date) return '未知';
    return new Date(date).toLocaleString('zh-CN');
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

          <div className="space-y-2">
            <Label>订阅状态</Label>
            <div className="text-sm text-muted-foreground">
              {localStorage.getItem('subscription_tier') === 'premium' ? '高级版' : '免费版'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 