export type AdminRole = 'admin' | 'super_admin';

export interface AdminUser {
  id: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface UserWithSubscription {
  id: string;
  email: string;
  created_at: string;
  subscription_tier: string;
  subscription_updated_at: string;
} 