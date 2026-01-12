'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import backendAPI from '@/lib/shopify/backend-api';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage({ 
  params 
}: { 
  params: Promise<{ orderNumber: string }> 
}) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const { orderNumber } = await params;
        
        // Get email from sessionStorage (set after checkout)
        const email = sessionStorage.getItem('orderEmail');
        
        if (!email) {
          setError('Đã hết phiên xem đơn hàng. Vui lòng sử dụng chức năng theo dõi đơn hàng.');
          setLoading(false);
          return;
        }

        const response = await backendAPI.getOrderByNumber(orderNumber, email);
        setOrder(response.data);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError('Không thể tải thông tin đơn hàng.');
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [params]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error || 'Không tìm thấy đơn hàng'}</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Đặt hàng thành công!
        </h1>
        <p className="text-lg text-gray-600">
          Cảm ơn bạn đã đặt hàng. Chúng tôi đã nhận được đơn hàng của bạn.
        </p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">Chi tiết đơn hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Mã đơn hàng:</p>
              <p className="font-semibold text-lg">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-600">Ngày đặt hàng:</p>
              <p className="font-semibold">
                {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Trạng thái:</p>
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                {order.status === 'PENDING' ? 'Đang xử lý' : order.status}
              </span>
            </div>
            <div>
              <p className="text-gray-600">Phương thức thanh toán:</p>
              <p className="font-semibold">
                {order.paymentMethod === 'cod' && 'Thanh toán khi nhận hàng (COD)'}
                {order.paymentMethod === 'momo' && 'Ví điện tử MoMo'}
                {order.paymentMethod === 'bank' && 'Chuyển khoản ngân hàng'}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-b pb-4 mb-4">
          <h3 className="font-semibold mb-2">Thông tin liên hệ</h3>
          <div className="text-sm space-y-1">
            <p className="text-gray-600">Email: <span className="text-black">{order.email}</span></p>
            <p className="text-gray-600">Số điện thoại: <span className="text-black">{order.phone}</span></p>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold mb-2">Địa chỉ giao hàng</h3>
            <div className="text-sm text-gray-700">
              <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.province && `, ${order.shippingAddress.province}`}
              </p>
              {order.shippingAddress.zip && <p>{order.shippingAddress.zip}</p>}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="mb-4">
          <h3 className="font-semibold mb-3">Sản phẩm đã đặt</h3>
          <div className="divide-y">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4 py-3">
                {item.imageUrl && (
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col justify-center">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  {item.variantTitle && item.variantTitle !== 'Default Title' && (
                    <p className="text-xs text-gray-600">{item.variantTitle}</p>
                  )}
                  <p className="text-xs text-gray-600">Số lượng: {item.quantity}</p>
                </div>
                <div className="text-right flex-shrink-0 flex flex-col justify-center">
                  <p className="font-medium text-sm">
                    ${parseFloat(item.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">
                    ${parseFloat(item.price).toFixed(2)} × {item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="border-t pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tạm tính:</span>
              <span className="font-medium">${parseFloat(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Phí vận chuyển:</span>
              <span className="font-medium">${parseFloat(order.shippingCost || 0).toFixed(2)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thuế:</span>
                <span className="font-medium">${parseFloat(order.tax).toFixed(2)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span className="font-medium">-${parseFloat(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Tổng cộng:</span>
              <span>${parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Note */}
        {order.customerNote && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-semibold mb-1">Ghi chú:</p>
            <p className="text-sm text-gray-700">{order.customerNote}</p>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      {order.paymentMethod === 'bank' && order.paymentStatus === 'PENDING' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">Hướng dẫn chuyển khoản</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>Vui lòng chuyển khoản theo thông tin sau:</p>
            <div className="bg-white p-4 rounded-md space-y-1">
              <p><strong>Ngân hàng:</strong> Vietcombank</p>
              <p><strong>Số tài khoản:</strong> 1234567890</p>
              <p><strong>Chủ tài khoản:</strong> CÔNG TY TNHH LUMI</p>
              <p><strong>Số tiền:</strong> ${parseFloat(order.total).toFixed(2)}</p>
              <p><strong>Nội dung:</strong> {order.orderNumber}</p>
            </div>
            <p className="text-xs">
              * Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán.
            </p>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-3">Bước tiếp theo</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Chúng tôi đã gửi email xác nhận đơn hàng đến {order.email}</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Đơn hàng sẽ được xử lý trong vòng 24 giờ</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Bạn sẽ nhận được thông báo khi đơn hàng được giao</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Mã đơn hàng của bạn: <strong>{order.orderNumber}</strong></span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center no-print">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-black px-8 py-3 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-8 py-3 text-black font-medium hover:bg-gray-50 transition-colors"
        >
          In đơn hàng
        </button>
      </div>

      {/* Support Info */}
      <div className="mt-12 text-center text-sm text-gray-600">
        <p>Cần hỗ trợ? Liên hệ chúng tôi qua:</p>
        <p className="mt-2">
          Email: <a href="mailto:support@lumi.com" className="text-black underline">support@lumi.com</a>
          {' | '}
          Hotline: <a href="tel:1900xxxx" className="text-black underline">1900 xxxx</a>
        </p>
      </div>
    </div>
  );
}
