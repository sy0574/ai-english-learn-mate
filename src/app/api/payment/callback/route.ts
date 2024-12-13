import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/api/paymentService';
import { PaymentMethod } from '@/lib/types/payment';

const paymentService = PaymentService.getInstance();

export async function POST(req: NextRequest) {
  try {
    const paymentMethod = req.headers.get('x-payment-method') as PaymentMethod;
    if (!paymentMethod) {
      return NextResponse.json(
        { error: '缺少支付方式' },
        { status: 400 }
      );
    }

    const callbackData = await req.json();
    const result = await paymentService.handlePaymentCallback(
      paymentMethod,
      callbackData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'success' });
  } catch (error) {
    console.error('Payment callback API error:', error);
    return NextResponse.json(
      { error: '支付回调处理失败' },
      { status: 500 }
    );
  }
} 