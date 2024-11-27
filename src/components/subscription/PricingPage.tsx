import { useState } from 'react';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_FEATURES, SubscriptionTier } from '@/lib/types/subscription';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';

const PRICING_PLANS = [
  {
    tier: 'free' as SubscriptionTier,
    name: '免费版',
    price: '¥0',
    description: '适合个人学习使用',
    highlighted: false,
  },
  {
    tier: 'pro' as SubscriptionTier,
    name: '进阶版',
    price: '¥99/月',
    description: '适合深度学习者',
    highlighted: true,
  },
  {
    tier: 'enterprise' as SubscriptionTier,
    name: '专业版',
    price: '¥299/月',
    description: '适合团队和机构使用',
    highlighted: false,
  },
];

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const currentTier = SubscriptionManager.getInstance().getCurrentTier();

  const handleUpgrade = async (tier: SubscriptionTier) => {
    try {
      await SubscriptionManager.getInstance().upgradeTier(tier);
      // 这里应该跳转到支付页面
    } catch (error) {
      console.error('升级失败:', error);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">选择适合您的计划</h1>
        <p className="text-xl text-muted-foreground">
          所有计划都包含核心功能，选择最适合您需求的版本
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.tier}
            className={`p-6 ${
              plan.highlighted ? 'border-primary shadow-lg' : ''
            }`}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold mb-2">{plan.price}</div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-6">
              {SUBSCRIPTION_FEATURES.map((feature) => {
                const included = feature.includedIn.includes(plan.tier);
                return (
                  <div
                    key={feature.id}
                    className={`flex items-center gap-2 ${
                      included ? '' : 'text-muted-foreground'
                    }`}
                  >
                    {included && <Check className="w-4 h-4 text-primary" />}
                    <span>{feature.name}</span>
                  </div>
                );
              })}
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  disabled={currentTier === plan.tier}
                >
                  {currentTier === plan.tier
                    ? '当前计划'
                    : `升级到${plan.name}`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认升级到{plan.name}</DialogTitle>
                  <DialogDescription>
                    升级后您将立即享受到{plan.name}的所有功能
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <p>费用：{plan.price}</p>
                  <p>主要功能：</p>
                  <ul className="list-disc pl-4 space-y-2">
                    {SUBSCRIPTION_FEATURES
                      .filter((feature) => feature.includedIn.includes(plan.tier))
                      .map((feature) => (
                        <li key={feature.id}>
                          {feature.name} - {feature.description}
                        </li>
                      ))}
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(plan.tier)}
                  >
                    确认升级
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        ))}
      </div>

      <div className="text-center text-muted-foreground">
        <p>需要更多信息？</p>
        <p>
          企业版用户可以联系我们的销售团队获取定制方案
          <Button variant="link">联系我们</Button>
        </p>
      </div>
    </div>
  );
}
