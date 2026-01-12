'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import backendAPI from '@/lib/shopify/backend-api';

export default function TrackOrderPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    orderNumber: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Verify order exists and email matches
      await backendAPI.getOrderByNumber(formData.orderNumber.trim(), formData.email.trim());
      
      // Store email in sessionStorage for order-success page to verify
      sessionStorage.setItem('orderEmail', formData.email.trim());
      
      // Redirect to order success page
      router.push(`/order-success/${formData.orderNumber.trim()}`);
    } catch (err: any) {
      console.error('Error tracking order:', err);
      if (err.message.includes('403')) {
        setError('Email không khớp với đơn hàng này.');
      } else if (err.message.includes('404')) {
        setError('Không tìm thấy đơn hàng với mã này.');
      } else if (err.message.includes('400')) {
        setError('Vui lòng nhập đầy đủ thông tin.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Tra cứu đơn hàng
        </h1>
        <p className="text-gray-600">
          Nhập mã đơn hàng và email để xem chi tiết đơn hàng của bạn
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium mb-2">
              Mã đơn hàng *
            </label>
            <input
              type="text"
              id="orderNumber"
              name="orderNumber"
              required
              value={formData.orderNumber}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, orderNumber: e.target.value.toUpperCase() }))
              }
              placeholder="ORD-2026-0001"
              className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">
              Mã đơn hàng được gửi qua email sau khi đặt hàng thành công
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Địa chỉ Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="email@example.com"
              className="w-full rounded-md border border-gray-300 px-4 py-3 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email bạn đã sử dụng khi đặt hàng
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang tìm kiếm...' : 'Xem đơn hàng'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-600 text-center">
            Bạn đã có tài khoản?{' '}
            <Link href="/login" className="text-black underline hover:no-underline">
              Đăng nhập
            </Link>
            {' '}để xem tất cả đơn hàng của bạn
          </p>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h2 className="font-semibold mb-3">Cần hỗ trợ?</h2>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Không nhận được email xác nhận?</strong>
            <br />
            Kiểm tra thư mục spam hoặc liên hệ với chúng tôi
          </p>
          <p>
            <strong>Quên mã đơn hàng?</strong>
            <br />
            Mã đơn hàng có dạng ORD-YYYY-XXXX và được gửi qua email
          </p>
          <p className="pt-2 border-t">
            Email: <a href="mailto:support@lumi.com" className="text-black underline">support@lumi.com</a>
            {' | '}
            Hotline: <a href="tel:1900xxxx" className="text-black underline">1900 xxxx</a>
          </p>
        </div>
      </div>
    </div>
  );
}
