'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [message, setMessage] = useState<string>('');
  const [orderNumber, setOrderNumber] = useState<string>('');

  useEffect(() => {
    const processPaymentResult = async () => {
      const method = searchParams.get('method');
      const vnpResponseCode = searchParams.get('vnp_ResponseCode');
      const vnpTxnRef = searchParams.get('vnp_TxnRef');
      const momoResultCode = searchParams.get('resultCode');
      const momoOrderId = searchParams.get('orderId');
      const momoMessage = searchParams.get('message');

      // Process VNPay result
      if (method === 'vnpay' || vnpResponseCode) {
        if (vnpResponseCode === '00') {
          setStatus('success');
          setMessage('Thanh toán VNPay thành công!');
          setOrderNumber(vnpTxnRef || '');
        } else if (vnpResponseCode === '24') {
          setStatus('failed');
          setMessage('Bạn đã hủy giao dịch thanh toán.');
        } else {
          setStatus('failed');
          const errorMessages: Record<string, string> = {
            '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
            '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.',
            '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
            '11': 'Đã hết hạn chờ thanh toán.',
            '12': 'Thẻ/Tài khoản bị khóa.',
            '13': 'OTP không chính xác.',
            '51': 'Tài khoản không đủ số dư.',
            '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
            '75': 'Ngân hàng thanh toán đang bảo trì.',
            '79': 'Nhập sai mật khẩu quá số lần quy định.',
            '99': 'Lỗi không xác định.',
          };
          setMessage(errorMessages[vnpResponseCode] || `Thanh toán thất bại (Mã lỗi: ${vnpResponseCode})`);
        }
        return;
      }

      // Process MoMo result
      if (method === 'momo' || momoResultCode !== null) {
        if (momoResultCode === '0') {
          setStatus('success');
          setMessage('Thanh toán MoMo thành công!');
          setOrderNumber(momoOrderId || '');
        } else if (momoResultCode === '1006') {
          setStatus('failed');
          setMessage('Bạn đã hủy giao dịch thanh toán MoMo.');
        } else {
          setStatus('failed');
          setMessage(momoMessage || `Thanh toán MoMo thất bại (Mã lỗi: ${momoResultCode})`);
        }
        return;
      }

      // No payment method detected
      setStatus('pending');
      setMessage('Không tìm thấy thông tin thanh toán.');
    };

    processPaymentResult();
  }, [searchParams]);

  // Auto redirect to order page after success
  useEffect(() => {
    if (status === 'success' && orderNumber) {
      const email = sessionStorage.getItem('orderEmail');
      const timer = setTimeout(() => {
        router.replace(`/order-success/${orderNumber}`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, orderNumber, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Đang xử lý kết quả thanh toán...
            </h1>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {orderNumber && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: <span className="font-semibold">{orderNumber}</span>
              </p>
            )}
            <p className="text-sm text-gray-400 mb-6">
              Bạn sẽ được chuyển đến trang chi tiết đơn hàng trong giây lát...
            </p>
            <div className="space-y-3">
              {orderNumber && (
                <Link
                  href={`/order-success/${orderNumber}`}
                  className="block w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Xem đơn hàng
                </Link>
              )}
              <Link
                href="/"
                className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Link
                href="/checkout"
                className="block w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Thử lại
              </Link>
              <Link
                href="/"
                className="block w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-6">
              Nếu bạn đã bị trừ tiền nhưng không nhận được đơn hàng, vui lòng liên hệ hotline để được hỗ trợ.
            </p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Không tìm thấy thông tin
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Về trang chủ
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
