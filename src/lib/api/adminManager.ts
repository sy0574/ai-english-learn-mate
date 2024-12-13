import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AdminRole, AdminUser, UserWithSubscription } from '@/lib/types/admin';
import { SubscriptionTier } from '@/lib/types/subscription';

export class AdminManager {
  private static instance: AdminManager;

  private constructor() {
    console.log('=== ADMIN MANAGER INITIALIZED ===');
  }

  public static getInstance(): AdminManager {
    if (!AdminManager.instance) {
      console.log('=== CREATING NEW ADMIN MANAGER INSTANCE ===');
      AdminManager.instance = new AdminManager();
    }
    return AdminManager.instance;
  }

  public async getCurrentAdminRole(): Promise<AdminRole | null> {
    try {
      console.log('=== GET ADMIN ROLE START ===');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current auth user:', user?.id);
      
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('=== QUERYING ADMIN ROLES ===');
      console.log('Querying for user ID:', user.id);
      
      const { data, error } = await supabaseAdmin
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('=== ADMIN ROLE ERROR ===');
        console.error('Error details:', error);
        return null;
      }

      if (!data) {
        console.log('=== NO ADMIN ROLE FOUND ===');
        console.log('User ID:', user.id);
        return null;
      }

      console.log('=== ADMIN ROLE FOUND ===');
      console.log('User ID:', user.id);
      console.log('Role:', data.role);
      return data.role as AdminRole;
    } catch (error) {
      console.error('=== UNEXPECTED ERROR IN GET ADMIN ROLE ===');
      console.error('Error details:', error);
      return null;
    }
  }

  public async getAllUsers(): Promise<UserWithSubscription[]> {
    console.log('=== GETTING ALL USERS ===');
    
    try {
      // Get all users using the admin API endpoint
      const { data: users, error: usersError } = await supabaseAdmin
        .auth
        .admin
        .listUsers();

      if (usersError) {
        console.error('Error getting users:', usersError);
        return [];
      }

      // Then get all subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*');

      if (subscriptionsError) {
        console.error('Error getting subscriptions:', subscriptionsError);
        return [];
      }

      // Map subscriptions by user_id for easier lookup
      const subscriptionMap = new Map(
        subscriptions.map(sub => [sub.user_id, sub])
      );

      // Combine user data with their subscription info
      const usersWithSubscriptions = users.users.map(user => {
        const subscription = subscriptionMap.get(user.id);
        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          subscription_tier: subscription?.tier || 'free',
          subscription_updated_at: subscription?.updated_at || user.created_at
        };
      });

      console.log(`Found ${usersWithSubscriptions.length} users`);
      return usersWithSubscriptions;
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  public async updateUserSubscription(
    userId: string,
    tier: SubscriptionTier
  ): Promise<boolean> {
    console.log('=== UPDATING USER SUBSCRIPTION ===');
    console.log('User ID:', userId);
    console.log('New tier:', tier);

    try {
      // Update subscription in database using upsert
      const { error: subscriptionError } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(
          {
            user_id: userId,
            tier,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (subscriptionError) {
        console.error('Error updating user subscription:', subscriptionError);
        return false;
      }

      // Insert subscription update notification
      const { error: updateError } = await supabaseAdmin
        .from('subscription_updates')
        .insert({
          user_id: userId,
          tier,
          updated_at: new Date().toISOString()
        });

      if (updateError) {
        console.error('Error creating subscription update notification:', updateError);
        // Don't return false here as the subscription was already updated
      }

      console.log('Successfully updated subscription');
      return true;
    } catch (error) {
      console.error('Error in updateUserSubscription:', error);
      return false;
    }
  }

  public async getAllAdmins(): Promise<AdminUser[]> {
    console.log('=== GETTING ALL ADMINS ===');
    const { data, error } = await supabaseAdmin
      .from('admin_roles')
      .select('*');

    if (error) {
      console.error('Error getting admins:', error);
      return [];
    }

    console.log(`Found ${data.length} admins`);
    return data as AdminUser[];
  }

  public async addAdmin(userId: string, role: AdminRole): Promise<boolean> {
    console.log('=== ADDING NEW ADMIN ===');
    console.log('User ID:', userId);
    console.log('Role:', role);

    const { error } = await supabaseAdmin
      .from('admin_roles')
      .insert({
        user_id: userId,
        role
      });

    if (error) {
      console.error('Error adding admin:', error);
      return false;
    }

    console.log('Successfully added admin');
    return true;
  }

  public async removeAdmin(userId: string): Promise<boolean> {
    console.log('=== REMOVING ADMIN ===');
    console.log('User ID:', userId);

    const { error } = await supabaseAdmin
      .from('admin_roles')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing admin:', error);
      return false;
    }

    console.log('Successfully removed admin');
    return true;
  }
} 