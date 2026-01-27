'use client';

import { useProductImages, useSelectedVariant } from '@/components/products/variant-selector';
import { Product } from '@/lib/api/types';
import Image from 'next/image';

export const ProductImage = ({ product }: { product: Product }) => {
  const selectedVariant = useSelectedVariant(product);

  const [variantImage] = useProductImages(product, selectedVariant?.selectedOptions);

  // Don't render if no valid image
  if (!variantImage || !variantImage.url) {
    return (
      <div className="flex items-center justify-center size-full bg-muted text-muted-foreground">
        No Image
      </div>
    );
  }

  return (
    <Image
      src={variantImage.url}
      alt={variantImage.altText || product.title}
      width={variantImage.width}
      height={variantImage.height}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover size-full"
      quality={100}
      placeholder={variantImage?.thumbhash ? 'blur' : undefined}
      blurDataURL={variantImage?.thumbhash}
    />
  );
};

