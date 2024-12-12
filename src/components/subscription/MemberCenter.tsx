'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { PRICING_PLANS, SubscriptionTier } from '@/lib/types/subscription';
import { PaymentMethod } from '@/lib/types/payment';
import { toast } from 'sonner';
import { useSubscription } from '@/hooks/useSubscription';
import { verifyPayment } from '@/api/payment';
import { getQRCodeUrl } from '@/config/payment';

type PaidTier = Exclude<SubscriptionTier, 'free'>;

export default function MemberCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTier, loading: subscriptionLoading, updateTier } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState<NodeJS.Timeout | null>(null);

  const clearVerificationTimer = useCallback(() => {
    if (verificationTimer) {
      clearInterval(verificationTimer);
      setVerificationTimer(null);
    }
  }, [verificationTimer]);

  useEffect(() => {
    return clearVerificationTimer;
  }, [clearVerificationTimer]);

  const handleSelectTier = (tier: SubscriptionTier) => {
    if (tier === currentTier) {
      toast.error('您已经是该等级会员');
      return;
    }
    setSelectedTier(tier);
  };

  const startPaymentVerification = useCallback(() => {
    clearVerificationTimer();
    setIsProcessing(true);

    const timer = setInterval(async () => {
      try {
        const { success } = await verifyPayment('mock-order');

        if (success && selectedTier) {
          clearInterval(timer);
          setVerificationTimer(null);
          const updated = await updateTier(selectedTier);
          if (updated) {
            toast.success('支付成功！');
            navigate(0); // Refresh the current page
          } else {
            toast.error('更新订阅失败，请联系客服');
          }
        }
      } catch (error) {
        console.error('Payment verification error:', error);
      }
    }, 3000);

    setVerificationTimer(timer);
  }, [clearVerificationTimer, navigate, selectedTier, updateTier]);

  useEffect(() => {
    if (selectedTier && selectedTier !== 'free') {
      startPaymentVerification();
    } else {
      clearVerificationTimer();
    }
    
    return () => {
      clearVerificationTimer();
    };
  }, [selectedTier, startPaymentVerification, clearVerificationTimer]);

  if (!user) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">请先登录以查看会员中心</p>
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">会员中心</h1>
      
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {Object.values(PRICING_PLANS).map((plan) => (
          <div
            key={plan.id}
            className={`
              p-6 rounded-lg shadow-lg
              ${selectedTier === plan.id ? 'ring-2 ring-blue-500' : ''}
              ${currentTier === plan.id ? 'bg-blue-50' : 'bg-white'}
            `}
          >
            <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <p className="text-3xl font-bold mb-6">
              ¥{plan.price}
              <span className="text-sm font-normal text-gray-600">/月</span>
            </p>
            <ul className="mb-6 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg
                    className="w-4 h-4 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSelectTier(plan.id)}
              disabled={currentTier === plan.id || isProcessing}
              className={`
                w-full py-2 px-4 rounded-md
                ${
                  currentTier === plan.id
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }
                text-white font-semibold transition-colors
              `}
            >
              {currentTier === plan.id ? '当前等级' : '选择套餐'}
            </button>
          </div>
        ))}
      </div>

      {selectedTier && selectedTier !== 'free' && (
        <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">支付方式</h3>
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setPaymentMethod('wechat')}
              className={`
                flex-1 py-2 px-4 rounded-md border
                ${paymentMethod === 'wechat' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              `}
            >
              微信支付
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('alipay')}
              className={`
                flex-1 py-2 px-4 rounded-md border
                ${paymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
              `}
            >
              支付宝
            </button>
          </div>

          <div className="text-center">
            <div className="mb-4">
              <img
                src={getQRCodeUrl(paymentMethod, selectedTier as PaidTier)}
                alt={`${paymentMethod === 'wechat' ? '微信' : '支付宝'}支付二维码`}
                className="mx-auto w-64 h-64 object-contain"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2">
              请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
            </p>
            <p className="text-xs text-gray-500">
              支付完成后会自动刷新页面
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
