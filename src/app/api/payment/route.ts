import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/api/paymentService';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const paymentService = PaymentService.getInstance();

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(cookies());
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: '未登录用户' },
        { status: 401 }
      );
    }

    const { tier, amount, paymentMethod } = await req.json();

    if (!tier || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const result = await paymentService.initiatePayment(
      user.id,
      tier,
      amount,
      paymentMethod
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { error: '支付请求处理失败' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { error: '缺少订单ID' },
        { status: 400 }
      );
    }

    const result = await paymentService.verifyPayment(orderId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Payment verification API error:', error);
    return NextResponse.json(
      { error: '支付验证失败' },
      { status: 500 }
    );
  }
} 