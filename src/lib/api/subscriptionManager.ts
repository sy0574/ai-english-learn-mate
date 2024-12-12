import { supabase } from '@/lib/supabase';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '@/lib/types/subscription';

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private currentTier: SubscriptionTier = 'free';
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.loadSubscription();
  }

  private async loadSubscription(): Promise<void> {
    if (!this.userId) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('Error loading subscription:', error);
      return;
    }

    if (data) {
      this.currentTier = data.tier as SubscriptionTier;
    }
  }

  public async getCurrentTier(): Promise<SubscriptionTier> {
    if (!this.userId) {
      return 'free';
    }
    await this.loadSubscription();
    return this.currentTier;
  }

  public async upgradeTier(tier: SubscriptionTier): Promise<void> {
    if (!this.userId) {
      throw new Error('用户未初始化');
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: this.userId,
        tier,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error('升级订阅失败');
    }

    this.currentTier = tier;
  }

  public getLimits(): typeof SUBSCRIPTION_LIMITS['free'] {
    return SUBSCRIPTION_LIMITS[this.currentTier];
  }

  public async getTemplateCount(): Promise<number> {
    if (!this.userId) return 0;

    const { count, error } = await supabase
      .from('templates')
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error getting template count:', error);
      return 0;
    }

    return count || 0;
  }
}
