import { supabase } from '@/lib/supabase';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '@/lib/types/subscription';

export class UsageLimitsError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'UsageLimitsError';
  }
}

// 用于类型检查的接口，暂时未使用
interface _UsageLimit {
  id: string;
  user_id: string;
  date: string;
  sentence_analysis_count: number;
  created_at: string;
  updated_at: string;
}

export class UsageLimitsManager {
  private static instance: UsageLimitsManager;
  private currentTier: SubscriptionTier = 'free';
  private tableExists: boolean | null = null;

  private constructor() {
    // 从本地存储加载订阅等级
    const savedTier = localStorage.getItem('subscription_tier');
    if (savedTier) {
      this.currentTier = savedTier as SubscriptionTier;
    }
  }

  public static getInstance(): UsageLimitsManager {
    if (!UsageLimitsManager.instance) {
      UsageLimitsManager.instance = new UsageLimitsManager();
    }
    return UsageLimitsManager.instance;
  }

  private async checkTableExists(): Promise<boolean> {
    if (this.tableExists !== null) {
      return this.tableExists;
    }

    try {
      const { error } = await supabase
        .from('usage_limits')
        .select('id')
        .limit(1);

      // 如果表不存在，error.code 会是 '42P01'
      if (error?.code === '42P01') {
        this.tableExists = false;
        return false;
      }

      this.tableExists = true;
      return true;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  private async getCurrentUsage(userId: string): Promise<number> {
    // 如果表不存在，返回0
    if (!await this.checkTableExists()) {
      return 0;
    }

    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('usage_limits')
        .select('sentence_analysis_count')
        .eq('user_id', userId)
        .eq('date', today);

      if (error) {
        console.error('Error fetching usage limits:', error);
        throw new UsageLimitsError('获取使用次数失败', error.code);
      }

      // 如果没有记录，返回0
      if (!data || data.length === 0) {
        return 0;
      }

      // 返回第一条记录的使用次数
      return data[0].sentence_analysis_count || 0;
    } catch (error) {
      console.error('Error in getCurrentUsage:', error);
      throw error;
    }
  }

  private async createOrUpdateUsage(userId: string): Promise<void> {
    // 如果表不存在，不允许继续使用
    if (!await this.checkTableExists()) {
      console.error('Usage limits table does not exist, skipping usage tracking');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      // 获取当前使用次数
      const currentUsage = await this.getCurrentUsage(userId);

      // 使用 upsert 操作，需要指定唯一约束
      const { error: upsertError } = await supabase
        .from('usage_limits')
        .upsert(
          {
            user_id: userId,
            date: today,
            sentence_analysis_count: currentUsage + 1,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,date',
            ignoreDuplicates: false
          }
        );

      if (upsertError) {
        console.error('Error updating usage limits:', upsertError);
        throw new UsageLimitsError('更新使用次数失败', upsertError.code);
      }
    } catch (error) {
      console.error('Error in createOrUpdateUsage:', error);
      throw error;
    }
  }

  public async checkAndIncrementUsage(userId: string): Promise<boolean> {
    try {
      // 如果表不存在，不允许使用
      if (!await this.checkTableExists()) {
        console.error('Usage limits table does not exist, blocking usage');
        return false;
      }

      // 重新从localStorage获取最新的订阅等级
      const savedTier = localStorage.getItem('subscription_tier');
      this.currentTier = (savedTier as SubscriptionTier) || 'free';

      const currentUsage = await this.getCurrentUsage(userId);
      const maxRequests = SUBSCRIPTION_LIMITS[this.currentTier].maxDailyRequests;

      // 检查是否超过限制
      if (currentUsage >= maxRequests) {
        console.log(`Usage limit exceeded: ${currentUsage}/${maxRequests}`);
        return false;
      }

      // 增加使用次数
      await this.createOrUpdateUsage(userId);
      return true;
    } catch (error) {
      console.error('Error checking usage limits:', error);
      // 如果发生错误，不允许继续使用
      return false;
    }
  }

  public async getDailyUsage(userId: string): Promise<number> {
    try {
      return await this.getCurrentUsage(userId);
    } catch (error) {
      console.error('Error getting daily usage:', error);
      return 0;
    }
  }

  public getMaxDailyRequests(): number {
    return SUBSCRIPTION_LIMITS[this.currentTier].maxDailyRequests;
  }
} 