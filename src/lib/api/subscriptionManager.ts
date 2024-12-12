import { supabase } from '@/lib/supabase';
import { SubscriptionTier } from '@/lib/types/subscription';

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private currentTier: SubscriptionTier = 'free';
  private userId: string | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Initialize from localStorage if available
    const savedTier = localStorage.getItem('subscription_tier');
    if (savedTier && this.isValidTier(savedTier)) {
      this.currentTier = savedTier as SubscriptionTier;
    }
  }

  private isValidTier(tier: string): tier is SubscriptionTier {
    return ['free', 'pro', 'enterprise'].includes(tier);
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public async initialize(userId: string): Promise<void> {
    console.log('=== INITIALIZING SUBSCRIPTION MANAGER ===');
    console.log('User ID:', userId);
    console.log('Previous state:', { userId: this.userId, tier: this.currentTier });
    
    if (this.userId !== userId || !this.initialized) {
      this.userId = userId;
      this.initialized = false;
      await this.loadSubscription();
      this.initialized = true;
    } else {
      console.log('Manager already initialized for this user');
    }
  }

  private async loadSubscription(): Promise<void> {
    if (!this.userId) {
      console.log('No user ID, using free tier');
      this.currentTier = 'free';
      localStorage.setItem('subscription_tier', 'free');
      return;
    }

    try {
      console.log('Loading subscription for user:', this.userId);
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier')
        .eq('user_id', this.userId)
        .single();

      if (error) {
        console.error('Error loading subscription:', error);
        this.currentTier = 'free';
        localStorage.setItem('subscription_tier', 'free');
        return;
      }

      if (data && this.isValidTier(data.tier)) {
        console.log('Subscription loaded:', data.tier);
        this.currentTier = data.tier;
        localStorage.setItem('subscription_tier', data.tier);
      } else {
        console.log('No valid subscription found, using free tier');
        this.currentTier = 'free';
        localStorage.setItem('subscription_tier', 'free');
      }
    } catch (error) {
      console.error('Error in loadSubscription:', error);
      this.currentTier = 'free';
      localStorage.setItem('subscription_tier', 'free');
    }
  }

  public async getCurrentTier(): Promise<SubscriptionTier> {
    if (!this.userId || !this.initialized) {
      console.log('Getting current tier - not initialized, returning free');
      return 'free';
    }
    await this.loadSubscription();
    console.log('Getting current tier:', this.currentTier);
    return this.currentTier;
  }

  public async upgradeTier(tier: SubscriptionTier): Promise<void> {
    if (!this.userId || !this.initialized) {
      throw new Error('用户未初始化');
    }

    console.log('Upgrading subscription:', { userId: this.userId, tier });

    const { error } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: this.userId,
        tier,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error upgrading subscription:', error);
      throw new Error('升级订阅失败');
    }

    this.currentTier = tier;
    localStorage.setItem('subscription_tier', tier);
    console.log('Subscription upgraded successfully');
  }
}
