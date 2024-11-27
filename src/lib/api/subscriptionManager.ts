import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '@/lib/types/subscription';

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private currentTier: SubscriptionTier = 'free';
  private dailyRequestCount: number = 0;
  private lastRequestDate: string = '';

  private constructor() {
    // 从本地存储加载状态
    const savedTier = localStorage.getItem('subscription_tier');
    if (savedTier) {
      this.currentTier = savedTier as SubscriptionTier;
    }

    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('last_request_date');
    const savedCount = localStorage.getItem('daily_request_count');

    if (savedDate === today && savedCount) {
      this.lastRequestDate = savedDate;
      this.dailyRequestCount = parseInt(savedCount, 10);
    }
  }

  public static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  public getCurrentTier(): SubscriptionTier {
    return this.currentTier;
  }

  public getLimits() {
    return SUBSCRIPTION_LIMITS[this.currentTier];
  }

  public async checkAndIncrementRequests(): Promise<boolean> {
    const today = new Date().toDateString();
    
    // 如果是新的一天，重置计数器
    if (this.lastRequestDate !== today) {
      this.dailyRequestCount = 0;
      this.lastRequestDate = today;
    }

    // 检查是否超过限制
    if (this.dailyRequestCount >= this.getLimits().maxDailyRequests) {
      return false;
    }

    // 增加计数并保存
    this.dailyRequestCount++;
    localStorage.setItem('last_request_date', today);
    localStorage.setItem('daily_request_count', this.dailyRequestCount.toString());
    return true;
  }

  public getDailyRequestCount(): number {
    const today = new Date().toDateString();
    if (this.lastRequestDate !== today) {
      return 0;
    }
    return this.dailyRequestCount;
  }

  public canCreateTemplate(): boolean {
    const templates = localStorage.getItem('task-templates');
    if (!templates) return true;
    
    const currentCount = JSON.parse(templates).length;
    return currentCount < this.getLimits().maxTemplates;
  }

  public canUseCustomTemplate(): boolean {
    return this.getLimits().customTemplates;
  }

  public hasPrioritySupport(): boolean {
    return this.getLimits().prioritySupport;
  }

  public hasAPIAccess(): boolean {
    return this.getLimits().apiAccess;
  }

  public hasAdvancedAnalytics(): boolean {
    return this.getLimits().advancedAnalytics;
  }

  public getTemplateCount(): number {
    const templates = localStorage.getItem('task-templates');
    if (templates) {
      return JSON.parse(templates).length;
    }
    return 0;
  }

  // 在实际项目中，这些方法应该与后端API交互
  public async upgradeTier(newTier: SubscriptionTier): Promise<void> {
    // 这里应该调用支付API和后端升级接口
    this.currentTier = newTier;
    localStorage.setItem('subscription_tier', newTier);
  }
}
