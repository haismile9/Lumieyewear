'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import backendAPI from '@/lib/shopify/backend-api';

interface CartItem {
  id: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    title: string;
    images?: Array<{ url: string; altText?: string }>;
  };
  variant?: {
    id: string;
    title: string;
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  totalPrice: number;
  discountAmount?: number;
}

interface CheckoutFormProps {
  cart: Cart;
}

export default function CheckoutForm({ cart }: CheckoutFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    district: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare order data
      const orderData = {
        items: cart.items.map((item) => ({
          productId: item.product?.id || '',
          variantId: item.variant?.id || '',
          quantity: item.quantity,
        })),
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          province: formData.district,
          country: 'VN',
        },
        paymentMethod: formData.paymentMethod,
        shippingMethod: 'standard',
        customerNote: formData.notes,
      };

      // Create order
      const response = await backendAPI.createOrder(orderData);

      // Clear cart after successful order
      await backendAPI.clearCart(cart.id);

      // Store email in sessionStorage for order verification
      sessionStorage.setItem('orderEmail', formData.email);

      // Redirect to order success page
      router.push(`/order-success/${response.order.orderNumber}`);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Shipping & Payment Form - Left side (2 columns) */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Contact Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Thông tin liên hệ</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0xxx xxx xxx"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                      Họ *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                      Tên *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="A"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address1" className="block text-sm font-medium mb-1">
                    Địa chỉ *
                  </label>
                  <input
                    type="text"
                    id="address1"
                    name="address1"
                    required
                    value={formData.address1}
                    onChange={handleInputChange}
                    placeholder="Số nhà, tên đường"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label htmlFor="address2" className="block text-sm font-medium mb-1">
                    Địa chỉ chi tiết (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    id="address2"
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    placeholder="Căn hộ, tầng, tòa nhà..."
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium mb-1">
                      Tỉnh/Thành phố *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Hồ Chí Minh"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label htmlFor="district" className="block text-sm font-medium mb-1">
                      Quận/Huyện (Không bắt buộc)
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleInputChange}
                      placeholder="Quận 1"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium mb-1">
                    Ghi chú đơn hàng (Không bắt buộc)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Ghi chú về đơn hàng, ví dụ: yêu cầu đặc biệt về giao hàng"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={formData.paymentMethod === 'momo'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Ví điện tử MoMo</span>
                      <img
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                        alt="MoMo"
                        className="h-6"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Thanh toán an toàn qua ví MoMo. Bạn sẽ được chuyển đến ứng dụng MoMo.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Chuyển khoản ngân hàng</span>
                      <img
                        src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
                        alt="Ngân hàng"
                        className="h-6"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Chuyển khoản trực tiếp vào tài khoản ngân hàng. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span className="font-medium">Thanh toán khi nhận hàng (COD)</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Thanh toán bằng tiền mặt khi nhận hàng.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                  Bằng việc đặt hàng, bạn đồng ý với{' '}
                  <Link href="/terms" className="underline hover:text-black">
                    Điều khoản & Điều kiện
                  </Link>
                  {' '}của chúng tôi
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary - Right side (1 column) */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border bg-white p-6 shadow-sm sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Đơn hàng</h2>

            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3 py-4">
                  {item.product?.images?.[0] && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.images[0].altText || item.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.product?.title}</h3>
                    {item.variant && (
                      <p className="text-xs text-gray-600">{item.variant.title}</p>
                    )}
                    <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-sm">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>${cart.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Calculated at next step</span>
              </div>
              {cart.discountAmount && cart.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${cart.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Total</span>
                <span>
                  $
                  {(
                    (cart.totalPrice || 0) - (cart.discountAmount || 0)
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-black underline block text-center"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
