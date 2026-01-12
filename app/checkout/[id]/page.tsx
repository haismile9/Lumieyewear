import { notFound } from 'next/navigation';
import backendAPI from '@/lib/shopify/backend-api';
import Link from 'next/link';
import CheckoutForm from '@/components/checkout/checkout-form';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let cart;
  try {
    const response = await backendAPI.getCart(id);
    cart = response.data;
  } catch (error) {
    console.error('Error fetching cart:', error);
    notFound();
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Giỏ hàng trống</h1>
          <p className="mt-4 text-gray-600">Thêm sản phẩm vào giỏ hàng để thanh toán.</p>
          <Link
            href="/shop"
            className="mt-8 inline-block rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Thanh toán</h1>
      <CheckoutForm cart={cart} />
    </div>
  );
}
