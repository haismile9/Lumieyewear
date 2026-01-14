'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { Package, MapPin, Calendar, CreditCard, Truck, ChevronLeft, Star } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productId: string;
  title: string;
  variantTitle: string | null;
  price: string;
  quantity: number;
  imageUrl: string | null;
  product?: {
    images: string[];
  };
}

interface Address {
  firstName: string;
  lastName: string;
  phone: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string | null;
  country: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingMethod: string;
  subtotal: string;
  shippingFee: string;
  total: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  shippingAddress: Address;
  items: OrderItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const orderNumber = params.orderNumber as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewedProducts, setReviewedProducts] = useState<Record<string, any>>({});
  
  // Review modal state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrderDetail();
  }, [token, orderNumber]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://127.0.0.1:5002/api/orders/number/${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy đơn hàng');
        } else if (response.status === 403) {
          throw new Error('Bạn không có quyền xem đơn hàng này');
        }
        throw new Error('Không thể tải thông tin đơn hàng');
      }

      const data = await response.json();
      console.log('Order data received:', data.data);
      console.log('Order items:', data.data?.items);
      console.log('Shipping address:', data.data?.shippingAddress);
      setOrder(data.data);
      
      // Fetch review status for all products in this order
      if (data.data?.status === 'DELIVERED' && data.data?.items?.length > 0) {
        await fetchReviewStatus(data.data.items.map((item: OrderItem) => item.productId));
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewStatus = async (productIds: string[]) => {
    if (!token || productIds.length === 0) return;

    try {
      const response = await fetch('http://127.0.0.1:5002/api/reviews/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviewedProducts(data.data || {});
      }
    } catch (error) {
      console.error('Error fetching review status:', error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedProduct || !token) return;

    setSubmitting(true);
    setReviewError('');

    try {
      const response = await fetch('http://127.0.0.1:5002/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: selectedProduct.productId,
          rating,
          title: reviewTitle,
          content: reviewContent,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Không thể gửi đánh giá');
      }

      // Reset form and close dialog
      setReviewDialogOpen(false);
      setSelectedProduct(null);
      setRating(5);
      setReviewTitle('');
      setReviewContent('');
      
      // Refresh review status
      if (order?.items) {
        await fetchReviewStatus(order.items.map(item => item.productId));
      }
      
      // Show success message (you could add a toast here)
      alert('Đánh giá của bạn đã được gửi thành công!');
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setReviewError(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewDialog = (item: OrderItem) => {
    setSelectedProduct(item);
    setRating(5);
    setReviewTitle('');
    setReviewContent('');
    setReviewError('');
    setReviewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const text: { [key: string]: string } = {
      PENDING: 'Chờ xác nhận',
      CONFIRMED: 'Đã xác nhận',
      PROCESSING: 'Đang xử lý',
      SHIPPED: 'Đang giao',
      DELIVERED: 'Đã giao',
      CANCELLED: 'Đã hủy',
    };
    return text[status] || status;
  };

  const getPaymentMethodText = (method: string) => {
    const methods: { [key: string]: string } = {
      COD: 'Thanh toán khi nhận hàng (COD)',
      BANK_TRANSFER: 'Chuyển khoản ngân hàng',
      CREDIT_CARD: 'Thẻ tín dụng/ghi nợ',
      MOMO: 'Ví MoMo',
      ZALOPAY: 'Ví ZaloPay',
    };
    return methods[method] || method;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">{error || 'Không tìm thấy đơn hàng'}</p>
          <Button asChild className="mt-4">
            <Link href="/account/orders">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách đơn hàng
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/account/orders">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Đơn hàng #{order.orderNumber}</h1>
            <Badge className={getStatusColor(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground ml-12">
            Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content - Order items */}
        <div className="md:col-span-2 space-y-6">
          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Sản phẩm ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 py-3 border-b last:border-b-0">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-white">
                    {item.imageUrl || item.product?.images?.[0] ? (
                      <img
                        src={item.imageUrl || item.product?.images?.[0] || ''}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                        <Package className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-base mb-1 line-clamp-2">{item.title}</h3>
                      {item.variantTitle && (
                        <p className="text-sm text-muted-foreground">Phân loại: {item.variantTitle}</p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Số lượng: x{item.quantity}</p>
                  </div>
                  <div className="text-right flex flex-col justify-between items-end">
                    <p className="font-semibold text-lg">{formatPrice(item.price, 'VND')}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice((parseFloat(item.price) * item.quantity).toString(), 'VND')}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Địa chỉ giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-base">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                </div>
                {order.shippingAddress.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm">{order.shippingAddress.phone}</p>
                  </div>
                )}
                <div className="flex items-start gap-2 text-muted-foreground">
                  <svg className="h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="text-sm">
                    <p>{order.shippingAddress.address1}</p>
                    {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                    <p>{order.shippingAddress.city}{order.shippingAddress.province && `, ${order.shippingAddress.province}`}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Order summary */}
        <div className="space-y-6">
          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Phương thức</p>
                <p className="text-sm font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                <Badge variant={order.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                  {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Shipping info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5" />
                Vận chuyển
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-1">Phương thức</p>
              <p className="text-sm font-medium">{order.shippingMethod}</p>
            </CardContent>
          </Card>

          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span>{formatPrice(order.subtotal, 'VND')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí vận chuyển</span>
                <span>{formatPrice(order.shippingFee || '0', 'VND')}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span className="text-lg">{formatPrice(order.total, 'VND')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          {order.status === 'PENDING' && (
            <Button variant="destructive" className="w-full">
              Hủy đơn hàng
            </Button>
          )}
          {order.status === 'DELIVERED' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Đánh giá sản phẩm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded overflow-hidden border">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                        {item.variantTitle && (
                          <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                        )}
                      </div>
                    </div>
                    {reviewedProducts[item.productId] ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        Đã đánh giá
                      </div>
                    ) : (
                      <Dialog open={reviewDialogOpen && selectedProduct?.id === item.id} onOpenChange={(open) => {
                      if (!open) {
                        setReviewDialogOpen(false);
                        setSelectedProduct(null);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openReviewDialog(item)}>
                          <Star className="h-4 w-4 mr-1" />
                          Đánh giá
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Đánh giá sản phẩm</DialogTitle>
                          <DialogDescription>
                            Chia sẻ trải nghiệm của bạn về sản phẩm này
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          {/* Product info */}
                          <div className="flex items-center gap-3 pb-4 border-b">
                            <div className="h-16 w-16 rounded overflow-hidden border">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-gray-50 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                              {item.variantTitle && (
                                <p className="text-xs text-muted-foreground">{item.variantTitle}</p>
                              )}
                            </div>
                          </div>

                          {/* Rating */}
                          <div>
                            <Label className="mb-2 block">Đánh giá của bạn</Label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRating(star)}
                                  onMouseEnter={() => setHoverRating(star)}
                                  onMouseLeave={() => setHoverRating(0)}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`h-8 w-8 transition-colors ${
                                      star <= (hoverRating || rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <Label htmlFor="review-title">Tiêu đề đánh giá</Label>
                            <Input
                              id="review-title"
                              value={reviewTitle}
                              onChange={(e) => setReviewTitle(e.target.value)}
                              placeholder="Tóm tắt đánh giá của bạn"
                              className="mt-1"
                            />
                          </div>

                          {/* Content */}
                          <div>
                            <Label htmlFor="review-content">Nội dung đánh giá</Label>
                            <Textarea
                              id="review-content"
                              value={reviewContent}
                              onChange={(e) => setReviewContent(e.target.value)}
                              placeholder="Chia sẽ chi tiết về sản phẩm..."
                              rows={4}
                              className="mt-1"
                            />
                          </div>

                          {reviewError && (
                            <p className="text-sm text-red-500">{reviewError}</p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                setReviewDialogOpen(false);
                                setSelectedProduct(null);
                              }}
                              disabled={submitting}
                            >
                              Hủy
                            </Button>
                            <Button
                              className="flex-1"
                              onClick={handleReviewSubmit}
                              disabled={submitting || !reviewTitle.trim() || !reviewContent.trim()}
                            >
                              {submitting ? 'Gửi...' : 'Gửi đánh giá'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
