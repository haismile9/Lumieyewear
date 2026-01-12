'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface WishlistItem {
  id: string;
  product: any;
  createdAt: string;
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    fetchWishlist();
  }, [page]);

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:5002/api/wishlist?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data = await response.json();
      setItems(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setRemoving(productId);

    try {
      const response = await fetch(`http://127.0.0.1:5002/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      await fetchWishlist();
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Không thể xóa sản phẩm');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Danh sách yêu thích trống</p>
          <p className="text-sm text-muted-foreground mb-6">
            Thêm sản phẩm yêu thích để xem sau
          </p>
          <Button asChild>
            <Link href="/shop">Khám phá sản phẩm</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sản phẩm yêu thích</h2>
          <p className="text-muted-foreground">{items.length} sản phẩm</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <Link href={`/product/${item.product.handle}`}>
              <div className="relative aspect-square">
                <Image
                  src={item.product.featuredImage?.url || '/placeholder.png'}
                  alt={item.product.title}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>
            <CardContent className="p-4">
              <Link href={`/product/${item.product.handle}`}>
                <h3 className="font-semibold mb-2 hover:text-primary">
                  {item.product.title}
                </h3>
              </Link>
              <p className="text-lg font-bold mb-4">
                {formatPrice(item.product.priceRange.minVariantPrice.amount, item.product.priceRange.minVariantPrice.currencyCode)}
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => removeItem(item.product.id)}
                disabled={removing === item.product.id}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {removing === item.product.id ? 'Đang xóa...' : 'Xóa'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
