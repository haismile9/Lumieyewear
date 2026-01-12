'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  createdAt: string;
  product: {
    id: string;
    title: string;
    handle: string;
    featuredImage?: { url: string };
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const fetchReviews = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://127.0.0.1:5002/api/reviews/me?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Chưa có đánh giá nào</p>
          <p className="text-sm text-muted-foreground">
            Đánh giá sản phẩm sau khi mua hàng
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Đánh giá của tôi</h2>
        <p className="text-muted-foreground">{reviews.length} đánh giá</p>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {review.product.featuredImage && (
                  <Link href={`/product/${review.product.handle}`}>
                    <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden">
                      <Image
                        src={review.product.featuredImage.url}
                        alt={review.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </Link>
                )}
                <div className="flex-1 space-y-2">
                  <Link
                    href={`/product/${review.product.handle}`}
                    className="font-semibold hover:text-primary"
                  >
                    {review.product.title}
                  </Link>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    {review.verified && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Đã mua hàng
                      </span>
                    )}
                  </div>
                  <p className="font-medium">{review.title}</p>
                  <p className="text-sm text-muted-foreground">{review.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
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
