'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Star, Package } from 'lucide-react';
import { reviewsApi } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  verifiedPurchase: boolean;
  user: {
    name: string;
  };
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const token = useAppSelector((state) => state.auth.token);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const data = await reviewsApi.getProductReviews(productId) as any;
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Vui lòng đăng nhập để đánh giá');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setSubmitting(true);

    try {
      await reviewsApi.create({
        productId,
        rating,
        title,
        content,
      });
      
      setSuccess('Đánh giá của bạn đã được gửi thành công');
      setTitle('');
      setContent('');
      setRating(5);
      
      // Refresh reviews
      await fetchReviews();
      
      setTimeout(() => {
        setDialogOpen(false);
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, size = 'h-5 w-5') => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={interactive ? 'cursor-pointer transition-colors' : 'cursor-default'}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? (hoverRating || rating) : rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Đánh giá sản phẩm</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(Number(averageRating))}
                <span className="text-2xl font-bold">{averageRating}</span>
                <span className="text-muted-foreground">({reviews.length} đánh giá)</span>
              </div>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Viết đánh giá của bạn</DialogTitle>
                  <DialogDescription>
                    Chia sẻ trải nghiệm của bạn về sản phẩm này
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Đánh giá của bạn</Label>
                    {renderStars(rating, true, 'h-8 w-8')}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      placeholder="Tóm tắt đánh giá của bạn"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Nội dung</Label>
                    <Textarea
                      id="content"
                      placeholder="Chi tiết về trải nghiệm của bạn..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Chưa có đánh giá nào</p>
              <p className="text-sm text-muted-foreground mt-2">
                Hãy là người đầu tiên đánh giá sản phẩm này
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{review.user.name}</p>
                      {review.verifiedPurchase && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Package className="h-3 w-3" />
                          Đã mua hàng
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(review.rating, false, 'h-4 w-4')}
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">{review.title}</h4>
                <p className="text-sm text-muted-foreground">{review.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

