'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import backendAPI from '@/lib/api/backend-api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { clearCart } from '@/store/slices/cartSlice';
import { useGetAddressesQuery, useUpdateAddressMutation } from '@/store/api/apiSlice';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { data: addressesData, isLoading: isLoadingAddresses } = useGetAddressesQuery(undefined, {
    skip: !user, // Only fetch if user is logged in
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAddressData, setEditingAddressData] = useState<any>(null);
  const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();

  // Shipping Methods State
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string>('');

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

  // Load shipping methods on mount
  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        setIsLoadingShipping(true);
        const response = await backendAPI.getShippingMethods();
        const activeMethods = response.data.filter(m => m.isActive);
        setShippingMethods(activeMethods);
        // Auto-select first method
        if (activeMethods.length > 0 && !selectedShippingMethod) {
          setSelectedShippingMethod(activeMethods[0].code);
          setShippingFee(parseFloat(activeMethods[0].basePrice) || 0);
        }
      } catch (err) {
        console.error('Error loading shipping methods:', err);
      } finally {
        setIsLoadingShipping(false);
      }
    };
    loadShippingMethods();
  }, []);

  // Update shipping fee when method changes
  useEffect(() => {
    if (selectedShippingMethod && shippingMethods.length > 0) {
      const method = shippingMethods.find(m => m.code === selectedShippingMethod);
      if (method) {
        setShippingFee(parseFloat(method.basePrice) || 0);
      }
    }
  }, [selectedShippingMethod, shippingMethods]);

  // Auto-fill user info when logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        firstName: user.name?.split(' ').slice(0, -1).join(' ') || prev.firstName,
        lastName: user.name?.split(' ').slice(-1)[0] || prev.lastName,
      }));
    }
  }, [user]);

  // Auto-select default address when logged in
  useEffect(() => {
    if (addressesData?.data && addressesData.data.length > 0 && !selectedAddressId && !useNewAddress) {
      const defaultAddress = addressesData.data.find((addr: any) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    }
  }, [addressesData, selectedAddressId, useNewAddress]);

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setIsValidatingCoupon(true);
      setCouponError('');
      const response = await backendAPI.validateCoupon(couponCode.trim(), cart.totalPrice || 0);
      
      if (response.valid && response.coupon) {
        setAppliedCoupon(response.coupon);
        setCouponDiscount(response.discountAmount || 0);
        toast.success(`Áp dụng mã "${response.coupon.code}" thành công!`);
      } else {
        setCouponError(response.message || 'Mã giảm giá không hợp lệ');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch (err: any) {
      setCouponError(err.message || 'Không thể kiểm tra mã giảm giá');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError('');
    toast.info('Đã bỏ mã giảm giá');
  };

  // Handle shipping method change
  const handleShippingMethodChange = (code: string) => {
    setSelectedShippingMethod(code);
  };

  // Auto-fill address when selected
  useEffect(() => {
    if (selectedAddressId && addressesData?.data) {
      const address = addressesData.data.find((addr: any) => addr.id === selectedAddressId);
      if (address) {
        setFormData((prev) => ({
          ...prev,
          firstName: address.firstName || prev.firstName,
          lastName: address.lastName || prev.lastName,
          address1: address.address1 || prev.address1,
          address2: address.address2 || prev.address2,
          city: address.city || prev.city,
          district: address.province || prev.district,
          phone: address.phone || prev.phone,
        }));
        setUseNewAddress(false);
        setIsEditingAddress(false); // Lock form when address is selected
      }
    }
  }, [selectedAddressId, addressesData]);

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
      // Validate shipping method
      if (!selectedShippingMethod) {
        setError('Vui lòng chọn phương thức vận chuyển');
        setIsSubmitting(false);
        return;
      }

      // Prepare order data with shipping and coupon
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
        shippingMethodCode: selectedShippingMethod,
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
        customerNote: formData.notes,
        cartId: cart.id,
        ...(user && { userId: user.id }),
      };

      // Create order
      const response = await backendAPI.createOrder(orderData);
      const order = response.order;

      // Clear cart after successful order
      try {
        await backendAPI.clearCart(cart.id);
      } catch (clearError) {
        console.warn('⚠️ Frontend cart clear failed:', clearError);
      }

      // Clear Redux cart state
      dispatch(clearCart());

      // Store email in sessionStorage for order verification
      sessionStorage.setItem('orderEmail', formData.email);

      // Handle payment redirects for VNPay/MoMo
      if (formData.paymentMethod === 'vnpay') {
        try {
          const paymentResponse = await backendAPI.createVNPayPayment({
            orderId: order.id,
            amount: parseFloat(order.total),
            orderInfo: `Thanh toan don hang ${order.orderNumber}`,
            returnUrl: `${window.location.origin}/checkout/result?method=vnpay`,
          });
          
          if (paymentResponse.success && paymentResponse.paymentUrl) {
            window.location.href = paymentResponse.paymentUrl;
            return;
          } else {
            throw new Error('Không thể tạo liên kết thanh toán VNPay');
          }
        } catch (paymentErr: any) {
          console.error('VNPay payment error:', paymentErr);
          toast.error('Lỗi tạo thanh toán VNPay. Đơn hàng đã được tạo, vui lòng thanh toán sau.');
          router.replace(`/order-success/${order.orderNumber}`);
          return;
        }
      }

      if (formData.paymentMethod === 'momo') {
        try {
          const paymentResponse = await backendAPI.createMoMoPayment({
            orderId: order.id,
            amount: parseFloat(order.total),
            orderInfo: `Thanh toan don hang ${order.orderNumber}`,
            returnUrl: `${window.location.origin}/checkout/result?method=momo`,
          });
          
          if (paymentResponse.success && paymentResponse.payUrl) {
            window.location.href = paymentResponse.payUrl;
            return;
          } else {
            throw new Error('Không thể tạo liên kết thanh toán MoMo');
          }
        } catch (paymentErr: any) {
          console.error('MoMo payment error:', paymentErr);
          toast.error('Lỗi tạo thanh toán MoMo. Đơn hàng đã được tạo, vui lòng thanh toán sau.');
          router.replace(`/order-success/${order.orderNumber}`);
          return;
        }
      }

      // For COD and bank transfer, redirect to success page
      router.replace(`/order-success/${order.orderNumber}`);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
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

            {/* Contact Information - Only show for guest users */}
            {!user && (
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
            )}

            {/* Shipping Information */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Thông tin giao hàng</h2>
              
              {/* Loading state */}
              {user && isLoadingAddresses && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">Đang tải địa chỉ đã lưu...</p>
                </div>
              )}

              {/* Info message when logged in but no addresses */}
              {user && !isLoadingAddresses && (!addressesData?.data || addressesData.data.length === 0) && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 mb-2">
                    💡 Bạn chưa có địa chỉ đã lưu.
                  </p>
                  <p className="text-xs text-amber-700">
                    Sau khi đặt hàng, bạn có thể lưu địa chỉ trong <Link href="/account/addresses" className="underline font-medium">Tài khoản</Link> để checkout nhanh hơn lần sau.
                  </p>
                </div>
              )}
              
              {/* Saved Addresses Section - Only show if logged in and has addresses */}
              {user && !isLoadingAddresses && addressesData?.data && addressesData.data.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    Chọn địa chỉ giao hàng
                  </label>
                  <div className="space-y-2">
                    {addressesData.data.map((address: any) => (
                      <div
                        key={address.id}
                        className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          selectedAddressId === address.id
                            ? 'border-black bg-gray-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="savedAddress"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-base">
                                {address.firstName} {address.lastName}
                              </p>
                              {address.isDefault && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium">
                                  Mặc định
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mt-2">
                              {address.address1}
                              {address.address2 && `, ${address.address2}`}
                            </p>
                            <p className="text-sm text-gray-700">
                              {address.city}, {address.province}
                            </p>
                            {address.phone && (
                              <p className="text-sm text-gray-600 mt-1">
                                {address.phone}
                              </p>
                            )}
                            
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddressData(address);
                              setIsEditModalOpen(true);
                            }}
                            className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                            Chỉnh sửa
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* New Address Option */}
                    <div
                      className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all ${
                        useNewAddress || (!selectedAddressId && isEditingAddress)
                          ? 'border-black bg-gray-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setUseNewAddress(true);
                        setSelectedAddressId('');
                        setIsEditingAddress(true);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={useNewAddress || (!selectedAddressId && isEditingAddress)}
                          onChange={() => {
                            setUseNewAddress(true);
                            setSelectedAddressId('');
                            setIsEditingAddress(true);
                          }}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-base">Sử dụng địa chỉ mới</p>
                          <p className="text-sm text-gray-600 mt-1">Nhập địa chỉ giao hàng mới</p>
                        </div>
                      </div>
                      
                    </div>
                  </div>

              
                </div>
              )}
              
              {/* Address Form Fields - Show only when editing or new address */}
              {(useNewAddress || isEditingAddress || !selectedAddressId || !user) && (
                <>
                  {selectedAddressId && isEditingAddress && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800">
                        💡 Bạn đang chỉnh sửa thông tin địa chỉ. Thay đổi sẽ chỉ áp dụng cho đơn hàng này.
                      </p>
                    </div>
                  )}
                  {!user && (
                    <p className="text-sm text-gray-600 mb-4">
                      Nhập địa chỉ giao hàng:
                    </p>
                  )}
                  
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
                </>
              )}
            </div>

            {/* Shipping Method Selection */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Phương thức vận chuyển</h2>
              {isLoadingShipping ? (
                <div className="p-4 text-center text-gray-500">
                  Đang tải phương thức vận chuyển...
                </div>
              ) : shippingMethods.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Không có phương thức vận chuyển khả dụng
                </div>
              ) : (
                <div className="space-y-3">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.code}
                      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedShippingMethod === method.code
                          ? 'border-black bg-gray-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.code}
                        checked={selectedShippingMethod === method.code}
                        onChange={() => handleShippingMethodChange(method.code)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{method.name}</span>
                          <span className="font-semibold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(parseFloat(method.basePrice) || 0)}
                          </span>
                        </div>
                        {method.description && (
                          <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                        )}
                        {method.estimatedDays && (
                          <p className="text-xs text-gray-500 mt-1">
                            ⏱ Thời gian dự kiến: {method.estimatedDays}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
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
                    <span className="font-medium">💵 Thanh toán khi nhận hàng (COD)</span>
                    <p className="text-sm text-gray-600 mt-1">
                      Thanh toán bằng tiền mặt khi nhận hàng.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={formData.paymentMethod === 'vnpay'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">VNPay</span>
                      <img
                        src="https://vinadesign.vn/uploads/images/2023/05/vnpay-logo-vinadesign-25-12-57-55.jpg"
                        alt="VNPay"
                        className="h-6 rounded"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Thanh toán qua VNPay - Hỗ trợ thẻ ATM, Visa, Mastercard và ví điện tử.
                    </p>
                  </div>
                </label>

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
                      <span className="font-medium">Ví MoMo</span>
                      <img
                        src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Square.png"
                        alt="MoMo"
                        className="h-6 rounded"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Thanh toán nhanh chóng và an toàn qua ví điện tử MoMo.
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
                      <span className="font-medium">🏦 Chuyển khoản ngân hàng</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Chuyển khoản trực tiếp vào tài khoản ngân hàng. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedShippingMethod}
                  className="w-full rounded-md bg-black px-6 py-3 text-white font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : formData.paymentMethod === 'vnpay' || formData.paymentMethod === 'momo' ? 'Đặt hàng & Thanh toán' : 'Đặt hàng'}
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

            {/* Coupon Code Input */}
            <div className="mt-6 pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Mã giảm giá</h3>
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      🎉 {appliedCoupon.code}
                    </p>
                    <p className="text-xs text-green-600">
                      {appliedCoupon.description || `Giảm ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(couponDiscount)}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isValidatingCoupon ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính</span>
                <span>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cart.totalPrice || 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span>
                  {shippingFee > 0 
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)
                    : 'Chọn phương thức'}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá ({appliedCoupon?.code})</span>
                  <span>
                    -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(couponDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-blue-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    (cart.totalPrice || 0) + shippingFee - couponDiscount
                  )}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-black underline block text-center"
              >
                ← Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>

      {/* Edit Address Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa địa chỉ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin địa chỉ giao hàng của bạn
            </DialogDescription>
          </DialogHeader>
          
          {editingAddressData && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const formData = new FormData(e.currentTarget);
                
                try {
                  await updateAddress({
                    id: editingAddressData.id,
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    address1: formData.get('address1') as string,
                    address2: formData.get('address2') as string,
                    city: formData.get('city') as string,
                    province: formData.get('province') as string,
                    phone: formData.get('phone') as string,
                    isDefault: editingAddressData.isDefault,
                  }).unwrap();
                  
                  toast.success('Cập nhật địa chỉ thành công!');
                  setIsEditModalOpen(false);
                  setEditingAddressData(null);
                } catch (error: any) {
                  toast.error(error?.data?.message || 'Không thể cập nhật địa chỉ');
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-firstName" className="block text-sm font-medium mb-1">
                    Họ *
                  </label>
                  <input
                    type="text"
                    id="edit-firstName"
                    name="firstName"
                    required
                    defaultValue={editingAddressData.firstName}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label htmlFor="edit-lastName" className="block text-sm font-medium mb-1">
                    Tên *
                  </label>
                  <input
                    type="text"
                    id="edit-lastName"
                    name="lastName"
                    required
                    defaultValue={editingAddressData.lastName}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  name="phone"
                  required
                  defaultValue={editingAddressData.phone}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="edit-address1" className="block text-sm font-medium mb-1">
                  Địa chỉ *
                </label>
                <input
                  type="text"
                  id="edit-address1"
                  name="address1"
                  required
                  defaultValue={editingAddressData.address1}
                  placeholder="Số nhà, tên đường"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label htmlFor="edit-address2" className="block text-sm font-medium mb-1">
                  Địa chỉ chi tiết (Không bắt buộc)
                </label>
                <input
                  type="text"
                  id="edit-address2"
                  name="address2"
                  defaultValue={editingAddressData.address2}
                  placeholder="Căn hộ, tầng, tòa nhà..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-city" className="block text-sm font-medium mb-1">
                    Tỉnh/Thành phố *
                  </label>
                  <input
                    type="text"
                    id="edit-city"
                    name="city"
                    required
                    defaultValue={editingAddressData.city}
                    placeholder="Hồ Chí Minh"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label htmlFor="edit-province" className="block text-sm font-medium mb-1">
                    Quận/Huyện (Không bắt buộc)
                  </label>
                  <input
                    type="text"
                    id="edit-province"
                    name="province"
                    defaultValue={editingAddressData.province}
                    placeholder="Quận 1"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingAddressData(null);
                  }}
                  disabled={isUpdatingAddress}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingAddress}
                  className="bg-black text-white hover:bg-gray-800"
                >
                  {isUpdatingAddress ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

