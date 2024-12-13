import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  SubscriptionTier,
  PRICING_PLANS as BASE_PRICING_PLANS
} from '@/lib/types/subscription';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';
import { useState, useEffect, useCallback } from 'react';

interface QRCodes {
  wechat: string | null;
  alipay: string | null;
}

interface ExtendedPricingPlan {
  tier: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  highlighted: boolean;
  qrCodes: QRCodes;
  features: string[];
}

const PRICING_PLANS: ExtendedPricingPlan[] = [
  {
    tier: 'free',
    name: BASE_PRICING_PLANS.free.name,
    price: '¥0',
    description: BASE_PRICING_PLANS.free.description,
    highlighted: false,
    features: BASE_PRICING_PLANS.free.features,
    qrCodes: {
      wechat: null,
      alipay: null
    }
  },
  {
    tier: 'pro',
    name: BASE_PRICING_PLANS.pro.name,
    price: `¥${BASE_PRICING_PLANS.pro.price}/月`,
    description: BASE_PRICING_PLANS.pro.description,
    highlighted: true,
    features: BASE_PRICING_PLANS.pro.features,
    qrCodes: {
      wechat: '/images/payment/wechat-pro.jpg',
      alipay: '/images/payment/alipay-pro.jpg'
    }
  },
  {
    tier: 'enterprise',
    name: BASE_PRICING_PLANS.enterprise.name,
    price: `¥${BASE_PRICING_PLANS.enterprise.price}/月`,
    description: BASE_PRICING_PLANS.enterprise.description,
    highlighted: false,
    features: BASE_PRICING_PLANS.enterprise.features,
    qrCodes: {
      wechat: '/images/payment/wechat-enterprise.jpg',
      alipay: '/images/payment/alipay-enterprise.jpg'
    }
  },
];

type PaymentMethod = 'wechat' | 'alipay';

export default function MemberCenter() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ExtendedPricingPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');

  const fetchCurrentTier = useCallback(async () => {
    try {
      const tier = await SubscriptionManager.getInstance().getCurrentTier();
      setCurrentTier(tier);
    } catch (error) {
      console.error('获取当前会员等级失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchCurrentTier();
  }, [fetchCurrentTier]);

  const handleUpgrade = useCallback((plan: ExtendedPricingPlan) => {
    setSelectedPlan(plan);
    setIsPaymentDialogOpen(true);
  }, []);

  const handlePaymentComplete = useCallback(async () => {
    if (!selectedPlan) return;
    
    try {
      await SubscriptionManager.getInstance().upgradeTier(selectedPlan.tier);
      setCurrentTier(selectedPlan.tier);
      setIsPaymentDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('升级失败:', error);
    }
  }, [selectedPlan]);

  const renderFeatureList = useCallback((features: string[]) => (
    <div className="space-y-4 mb-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-primary" />
          <span>{feature}</span>
        </div>
      ))}
    </div>
  ), []);

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">会员中心</h1>
        <p className="text-xl text-muted-foreground">
          解锁更多高级功能，提升您的学习体验
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
              <div className="text-3xl font-bold mb-2 text-primary">{plan.price}</div>
              <p className="text-muted-foreground">{plan.description}</p>
            </div>

            {renderFeatureList(plan.features)}

            <Button
              className="w-full"
              variant={plan.highlighted ? 'default' : 'outline'}
              disabled={currentTier === plan.tier}
              onClick={() => handleUpgrade(plan)}
            >
              {currentTier === plan.tier ? '当前计划' : `升级到${plan.name}`}
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>扫码支付</DialogTitle>
            <DialogDescription>
              请使用支付宝或微信扫描下方二维码完成支付
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedPlan && (
              <>
                <div className="text-center mb-4">
                  <p className="font-semibold">{selectedPlan.name}</p>
                  <p className="text-2xl font-bold text-primary">{selectedPlan.price}</p>
                </div>
                <div className="flex gap-4 mb-4">
                  <Button
                    variant={paymentMethod === 'wechat' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('wechat')}
                  >
                    微信支付
                  </Button>
                  <Button
                    variant={paymentMethod === 'alipay' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('alipay')}
                  >
                    支付宝
                  </Button>
                </div>
                {selectedPlan.qrCodes[paymentMethod] ? (
                  <div className="relative w-64 h-64">
                    <img
                      src={selectedPlan.qrCodes[paymentMethod]!}
                      alt={`${paymentMethod === 'wechat' ? '微信' : '支付宝'}支付二维码`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">免费版无需支付</p>
                )}
                {selectedPlan.tier !== 'free' && (
                  <Button onClick={handlePaymentComplete} className="w-full">
                    我已完成支付
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-center text-muted-foreground mt-12">
        <div className="max-w-xl mx-auto bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">如遇问题，加开发者Carl本人微信👇🏻</h3>
          <div className="flex flex-col items-center space-y-4">

            <div className="relative w-32 h-32 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <img
                src="/images/contact/wechat-contact.jpg"
                alt="Carl私人微信"
                className="w-full h-full object-contain p-2"
              />
            </div>
            <p className="text-xs text-muted-foreground">活跃时间: 9:00-21:00</p>
          </div>
        </div>
      </div>
    </div>
  );
} 