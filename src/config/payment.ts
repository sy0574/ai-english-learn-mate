import { PaymentMethod } from '@/lib/types/payment';
import { SubscriptionTier } from '@/lib/types/subscription';

// QR code image paths for different payment methods and tiers
const QR_CODE_PATHS = {
  wechat: {
    pro: '/images/payment/wechat-pro.jpg',
    enterprise: '/images/payment/wechat-enterprise.jpg',
  },
  alipay: {
    pro: '/images/payment/alipay-pro.jpg',
    enterprise: '/images/payment/alipay-enterprise.jpg',
  },
} as const;

// In a real application, these would be environment variables
export const PAYMENT_CONFIG = {
  wechat: {
    appId: 'mock_wechat_appid',
    mchId: 'mock_wechat_mchid',
    notifyUrl: 'http://localhost:5173/api/payment/callback',
  },
  alipay: {
    appId: 'mock_alipay_appid',
    privateKey: 'mock_alipay_private_key',
    publicKey: 'mock_alipay_public_key',
    notifyUrl: 'http://localhost:5173/api/payment/callback',
  },
};

// Get the actual QR code image path
export function getQRCodeUrl(method: PaymentMethod, tier: Exclude<SubscriptionTier, 'free'>): string {
  return QR_CODE_PATHS[method][tier];
} 