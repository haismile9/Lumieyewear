import { API_BASE_URL } from '@/lib/constants';
import { ProductReviewsClient } from './product-reviews-client';

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

interface ProductReviewsWrapperProps {
  productId: string;
}

async function getProductReviews(productId: string): Promise<Review[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`, {
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!response.ok) {
      console.error('Failed to fetch reviews:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return [];
  }
}

export async function ProductReviews({ productId }: ProductReviewsWrapperProps) {
  const initialReviews = await getProductReviews(productId);

  return <ProductReviewsClient productId={productId} initialReviews={initialReviews} />;
}
