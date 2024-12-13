import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/lib/api/paymentService';
import { PaymentMethod } from '@/lib/types/payment';

const paymentService = PaymentService.getInstance();

export async function POST(req: NextRequest) {
  try {
    // 验证请求来源
    const signature = req.headers.get('x-payment-signature');
    if (!signature) {
      return NextResponse.json(
        { error: '无效的请求签名' },
        { status: 401 }
      );
    }

    const paymentMethod = req.headers.get('x-payment-method') as PaymentMethod;
    if (!paymentMethod) {
      return NextResponse.json(
        { error: '缺少支付方式' },
        { status: 400 }
      );
    }

    const callbackData = await req.json();
    
    // 处理支付回调
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

    // 返回成功响应
    // 注意：微信支付要求返回 XML 格式的成功响应
    if (paymentMethod === 'wechat') {
      return new NextResponse(
        '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
        {
          headers: {
            'Content-Type': 'text/xml',
          },
        }
      );
    }

    // 支付宝返回 success 字符串
    if (paymentMethod === 'alipay') {
      return new NextResponse('success', {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return NextResponse.json({ message: 'success' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { error: '支付回调处理失败' },
      { status: 500 }
    );
  }
} 