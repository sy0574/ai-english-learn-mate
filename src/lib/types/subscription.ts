export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionLimits {
  maxDailyRequests: number;
  maxTemplates: number;
  availableModels: string[];
  customTemplates: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  responseTimeMs: number;
}

export interface PricingPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxTemplates: 3,
    maxDailyRequests: 10,
    availableModels: ['gpt-3.5-turbo'],
    customTemplates: false,
    prioritySupport: false,
    apiAccess: false,
    advancedAnalytics: false,
    responseTimeMs: 5000,
  },
  pro: {
    maxTemplates: 10,
    maxDailyRequests: 100,
    availableModels: ['gpt-3.5-turbo', 'gpt-4'],
    customTemplates: true,
    prioritySupport: true,
    apiAccess: false,
    advancedAnalytics: true,
    responseTimeMs: 2000,
  },
  enterprise: {
    maxTemplates: 999999,
    maxDailyRequests: 999999,
    availableModels: ['gpt-3.5-turbo', 'gpt-4', 'claude-2'],
    customTemplates: true,
    prioritySupport: true,
    apiAccess: true,
    advancedAnalytics: true,
    responseTimeMs: 1000,
  },
};

export const PRICING_PLANS: Record<SubscriptionTier, PricingPlan> = {
  free: {
    id: 'free',
    name: '免费版',
    description: '体验基础功能',
    price: 0,
    features: [
      '每日10次AI对话',
      '3个任务模板',
      '基础AI模型',
      '基础功能使用',
    ],
  },
  pro: {
    id: 'pro',
    name: '专业版',
    description: '解锁更多高级功能',
    price: 29,
    features: [
      '每日100次AI对话',
      '10个任务模板',
      '3个高级AI模型',
      '自定义模板',
      '优先客服支持',
      '高级数据分析',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: '企业版',
    description: '定制化解决方案',
    price: 299,
    features: [
      '无限AI对话',
      '无限任务模板',
      '所有AI模型',
      '完全自定义',
      '24/7专属支持',
      'API访问权限',
      '企业级分析',
    ],
  },
};

export const SUBSCRIPTION_FEATURES: SubscriptionFeature[] = [
  {
    id: 'ai-models',
    name: 'AI模型选择',
    description: '可使用的AI模型数量和种类',
    includedIn: ['pro', 'enterprise'],
  },
  {
    id: 'daily-requests',
    name: '每日请求次数',
    description: '每天可以进行的AI对话次数',
    includedIn: ['free', 'pro', 'enterprise'],
  },
  {
    id: 'templates',
    name: '任务模板',
    description: '可以保存的任务模板数量',
    includedIn: ['free', 'pro', 'enterprise'],
  },
  {
    id: 'custom-params',
    name: '自定义模型参数',
    description: '自定义AI模型的参数设置',
    includedIn: ['pro', 'enterprise'],
  },
  {
    id: 'priority',
    name: '优先处理',
    description: '任务优先级处理和更快的响应时间',
    includedIn: ['pro', 'enterprise'],
  },
  {
    id: 'analytics',
    name: '数据分析',
    description: '详的学习进度和效果分析',
    includedIn: ['pro', 'enterprise'],
  },
  {
    id: 'api',
    name: 'API访问',
    description: '通过API接口访问系统功能',
    includedIn: ['enterprise'],
  },
  {
    id: 'support',
    name: '客服支持',
    description: '专业的客服支持服务',
    includedIn: ['pro', 'enterprise'],
  },
];

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  includedIn: SubscriptionTier[];
}
