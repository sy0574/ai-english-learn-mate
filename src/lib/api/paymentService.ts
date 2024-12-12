import { OrderManager } from './orderManager';
import { PaymentMethod } from '@/lib/types/payment';
import { SubscriptionManager } from './subscriptionManager';
import { SubscriptionTier } from '@/lib/types/subscription';

export interface PaymentResult {
  success: boolean;
  message: string;
  orderId?: string;
  paymentId?: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private orderManager: OrderManager;
  private subscriptionManager: SubscriptionManager;

  private constructor() {
    this.orderManager = OrderManager.getInstance();
    this.subscriptionManager = SubscriptionManager.getInstance();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  public async initiatePayment(
    userId: string,
    tier: SubscriptionTier,
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<PaymentResult> {
    try {
      // 创建订单
      const order = await this.orderManager.createOrder(
        userId,
        tier,
        amount,
        paymentMethod
      );

      // 记录支付初始化日志
      await this.orderManager.logPayment(order.id, 'initiated', {
        userId,
        tier,
        amount,
        paymentMethod,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: '支付初始化成功',
        orderId: order.id,
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '支付初始化失败',
      };
    }
  }

  public async verifyPayment(orderId: string): Promise<PaymentResult> {
    try {
      const order = await this.orderManager.getOrder(orderId);
      if (!order) {
        return {
          success: false,
          message: '订单不存在',
        };
      }

      if (order.status === 'success') {
        return {
          success: true,
          message: '支付已完成',
          orderId,
          paymentId: order.payment_id,
        };
      }

      // 这里应该调用实际的支付平台API验证支付状态
      // 目前使用模拟验证
      const mockVerification = await this.mockVerifyPayment(order);

      if (mockVerification.success) {
        // 更新订单状态
        await this.orderManager.updateOrderStatus(
          orderId,
          'success',
          mockVerification.paymentId
        );

        // 更新用户订阅
        await this.subscriptionManager.upgradeTier(order.subscription_tier);

        // 记录支付成功日志
        await this.orderManager.logPayment(orderId, 'success', {
          verificationTime: new Date().toISOString(),
          paymentId: mockVerification.paymentId,
        });

        return {
          success: true,
          message: '支付验证成功',
          orderId,
          paymentId: mockVerification.paymentId,
        };
      } else {
        // 记录验证失败日志
        await this.orderManager.logPayment(orderId, 'verification_failed', {
          verificationTime: new Date().toISOString(),
          error: mockVerification.message,
        });

        return {
          success: false,
          message: mockVerification.message,
          orderId,
        };
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      return {
        success: false,
        message: '支付验证失败',
        orderId,
      };
    }
  }

  private async mockVerifyPayment(order: any): Promise<PaymentResult> {
    // 检查订单是否过期
    if (new Date(order.expired_at) < new Date()) {
      return {
        success: false,
        message: '订单已过期',
      };
    }

    // 模拟50%的支付成功率
    const isSuccess = Math.random() < 0.5;
    
    if (isSuccess) {
      return {
        success: true,
        message: '支付成功',
        paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
    } else {
      return {
        success: false,
        message: '支付未完成',
      };
    }
  }

  public async handlePaymentCallback(
    paymentMethod: PaymentMethod,
    callbackData: any
  ): Promise<PaymentResult> {
    try {
      // 验证回调签名
      if (!this.verifyCallbackSignature(paymentMethod, callbackData)) {
        throw new Error('回调签名验证失败');
      }

      // 解析订单号
      const orderId = this.extractOrderId(paymentMethod, callbackData);
      if (!orderId) {
        throw new Error('无效的订单号');
      }

      // 获取订单信息
      const order = await this.orderManager.getOrder(orderId);
      if (!order) {
        throw new Error('订单不存在');
      }

      // 验证支付金额
      if (!this.verifyPaymentAmount(order, callbackData)) {
        throw new Error('支付金额不匹配');
      }

      // 更新订单状态
      const paymentId = this.extractPaymentId(paymentMethod, callbackData);
      await this.orderManager.updateOrderStatus(orderId, 'success', paymentId);

      // 更新用户订阅
      await this.subscriptionManager.upgradeTier(order.subscription_tier);

      // 记录支付日志
      await this.orderManager.logPayment(orderId, 'callback_success', callbackData);

      return {
        success: true,
        message: '支付回调处理成功',
        orderId,
        paymentId,
      };
    } catch (error) {
      console.error('Payment callback error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '支付回调处理失败',
      };
    }
  }

  private verifyCallbackSignature(
    paymentMethod: PaymentMethod,
    callbackData: any
  ): boolean {
    // 实际应用中需要根据支付平台的签名规则进行验证
    // 这里仅作示例
    return true;
  }

  private extractOrderId(paymentMethod: PaymentMethod, callbackData: any): string | null {
    // 实际应用中需要根据支付平台的回调数据格式提取订单号
    return callbackData.orderId || null;
  }

  private extractPaymentId(paymentMethod: PaymentMethod, callbackData: any): string | null {
    // 实际应用中需要根据支付平台的回调数据格式提取支付ID
    return callbackData.paymentId || `PAY_${Date.now()}`;
  }

  private verifyPaymentAmount(order: any, callbackData: any): boolean {
    // 实际应用中需要验证回调中的支付金额是否与订单金额匹配
    return true;
  }
} 