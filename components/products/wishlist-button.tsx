'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { wishlistApi } from '@/lib/api-client';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  showText?: boolean;
}

export function WishlistButton({ 
  productId, 
  className, 
  size = 'icon',
  variant = 'ghost',
  showText = false 
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
  }, [productId, user]);

  const checkWishlistStatus = async () => {
    try {
      const response = await wishlistApi.check(productId) as { inWishlist: boolean };
      setIsInWishlist(response.inWishlist || false);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        await wishlistApi.remove(productId);
        setIsInWishlist(false);
      } else {
        await wishlistApi.add(productId);
        setIsInWishlist(true);
      }
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      alert(error.message || 'Không thể cập nhật wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={toggleWishlist}
      disabled={loading}
      size={size}
      variant={variant}
      className={cn(
        'relative transition-all pointer-events-auto',
        isInWishlist && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart 
        className={cn(
          'h-5 w-5 transition-all',
          isInWishlist && 'fill-current'
        )} 
      />
      {showText && (
        <span className="ml-2">
          {isInWishlist ? 'Đã yêu thích' : 'Yêu thích'}
        </span>
      )}
    </Button>
  );
}
