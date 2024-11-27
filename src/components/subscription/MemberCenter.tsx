import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';
import { PRICING_PLANS } from '@/lib/types/subscription';
import { QRCodeSVG } from 'qrcode.react';

export default function MemberCenter() {
  const [_paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [showPayment, setShowPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [_orderStatus, setOrderStatus] = useState<'pending' | 'success' | 'failed'>('pending');

  const subscriptionManager = SubscriptionManager.getInstance();
  const currentTier = subscriptionManager.getCurrentTier();
  const limits = subscriptionManager.getLimits();
  const [dailyRequests, setDailyRequests] = useState(0);

  useEffect(() => {
    // 在实际项目中，这里应该从后端获取用户的使用统计
    const count = parseInt(localStorage.getItem('daily_request_count') || '0', 10);
    setDailyRequests(count);
  }, []);

  const _handleUpgrade = async (planId: string) => {
    try {
      // 在实际项目中，这里应该调用后端API创建订单
      const mockOrderResponse = {
        orderId: 'ORDER_' + Date.now(),
        qrCode: 'https://example.com/mock-qr-code',
      };

      setQrCodeUrl(mockOrderResponse.qrCode);
      setShowPayment(true);

      // 模拟订单状态轮询
      const checkOrderStatus = setInterval(async () => {
        // 在实际项目中，这里应该调用后端API检查订单状态
        const mockStatus = 'pending';
        if (mockStatus === 'success') {
          clearInterval(checkOrderStatus);
          setOrderStatus('success');
          setShowPayment(false);
          // 更新订阅状态
          await subscriptionManager.upgradeTier(planId as any);
        }
      }, 3000);
    } catch (error) {
      console.error('创建订单失败:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8">
        {/* 会员状态卡片 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                当前会员等级：{PRICING_PLANS[currentTier].name}
              </h2>
              <p className="text-muted-foreground">
                {PRICING_PLANS[currentTier].description}
              </p>
            </div>
            <Button onClick={() => setShowPayment(true)}>升级会员</Button>
          </div>

          {/* 使用统计 */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>今日请求次数</span>
                <span>{dailyRequests} / {limits.maxDailyRequests}</span>
              </div>
              <Progress
                value={(dailyRequests / limits.maxDailyRequests) * 100}
              />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span>可用模板数</span>
                <span>{subscriptionManager.getTemplateCount()} / {limits.maxTemplates}</span>
              </div>
              <Progress
                value={(subscriptionManager.getTemplateCount() / limits.maxTemplates) * 100}
              />
            </div>
          </div>
        </Card>

        {/* 支付弹窗 */}
        <Dialog open={showPayment} onOpenChange={setShowPayment}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>选择支付方式</DialogTitle>
            </DialogHeader>
            <Tabs
              defaultValue="wechat"
              onValueChange={(value) => setPaymentMethod(value as 'wechat' | 'alipay')}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wechat">微信支付</TabsTrigger>
                <TabsTrigger value="alipay">支付宝</TabsTrigger>
              </TabsList>
              <TabsContent value="wechat" className="mt-4">
                <div className="flex flex-col items-center">
                  <QRCodeSVG
                    value={qrCodeUrl || 'https://example.com/mock-wechat-pay'}
                    size={200}
                    level="H"
                    imageSettings={{
                      src: '/images/payment/wechat-pay-logo.png',
                      width: 40,
                      height: 40,
                      excavate: true,
                    }}
                  />
                  <p className="mt-4 text-muted-foreground">
                    请使用微信扫描二维码完成支付
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="alipay" className="mt-4">
                <div className="flex flex-col items-center">
                  <QRCodeSVG
                    value={qrCodeUrl || 'https://example.com/mock-alipay'}
                    size={200}
                    level="H"
                    imageSettings={{
                      src: '/images/payment/alipay-logo.png',
                      width: 40,
                      height: 40,
                      excavate: true,
                    }}
                  />
                  <p className="mt-4 text-muted-foreground">
                    请使用支付宝扫描二维码完成支付
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
