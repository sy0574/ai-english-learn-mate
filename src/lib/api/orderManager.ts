import { supabase } from '@/lib/supabase';
import { SubscriptionTier } from '@/lib/types/subscription';
import { PaymentMethod } from '@/lib/types/payment';

export interface Order {
  id: string;
  user_id: string;
  subscription_tier: SubscriptionTier;
  amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_id?: string;
  created_at: string;
  updated_at: string;
  expired_at: string;
  metadata: Record<string, any>;
}

export type OrderStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export class OrderManager {
  private static instance: OrderManager;
  private ORDER_EXPIRATION_MINUTES = 30;

  private constructor() {}

  public static getInstance(): OrderManager {
    if (!OrderManager.instance) {
      OrderManager.instance = new OrderManager();
    }
    return OrderManager.instance;
  }

  public async createOrder(
    userId: string,
    tier: SubscriptionTier,
    amount: number,
    paymentMethod: PaymentMethod
  ): Promise<Order> {
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + this.ORDER_EXPIRATION_MINUTES);

    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        subscription_tier: tier,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        expired_at: expiredAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw new Error('创建订单失败');
    }

    return data as Order;
  }

  public async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('Error getting order:', error);
      return null;
    }

    return data as Order;
  }

  public async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    paymentId?: string
  ): Promise<void> {
    const updates: Partial<Order> = {
      status,
      ...(paymentId && { payment_id: paymentId }),
    };

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      throw new Error('更新订单状态失败');
    }
  }

  public async logPayment(
    orderId: string,
    status: string,
    rawData: any
  ): Promise<void> {
    const { error } = await supabase
      .from('payment_logs')
      .insert({
        order_id: orderId,
        status,
        raw_data: rawData,
      });

    if (error) {
      console.error('Error logging payment:', error);
      throw new Error('记录支付日志失败');
    }
  }

  public async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user orders:', error);
      return [];
    }

    return data as Order[];
  }

  public async cleanExpiredOrders(): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('status', 'pending')
      .lt('expired_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning expired orders:', error);
    }
  }
} 