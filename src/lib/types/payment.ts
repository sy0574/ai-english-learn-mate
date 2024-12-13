export type PaymentMethod = 'wechat' | 'alipay';

export interface PaymentConfig {
  appId: string;
  mchId?: string;
  apiKey?: string;
  privateKey?: string;
  publicKey?: string;
  notifyUrl: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
}

export interface PaymentCallback {
  orderId: string;
  paymentId: string;
  amount: number;
  status: string;
  paymentMethod: PaymentMethod;
  timestamp: string;
  signature: string;
  rawData: any;
} 