'use client';

import { useProductImages, useSelectedVariant } from '@/components/products/variant-selector';
import { Product } from '@/lib/api/types';
import Image from 'next/image';
import { getImageUrl } from '@/lib/api-client';

export const DesktopGallery = ({ product }: { product: Product }) => {
  const selectedVariant = useSelectedVariant(product);
  const images = useProductImages(product, selectedVariant?.selectedOptions);

  return images.map(image => (
    <Image
      style={{
        aspectRatio: `${image.width} / ${image.height}`,
      }}
      key={`${image.url}-${image.selectedOptions?.map(o => `${o.name},${o.value}`).join('-')}`}
      src={getImageUrl(image.url)}
      alt={image.altText}
      width={image.width}
      height={image.height}
      className="w-full object-cover"
      quality={100}
    />
  ));
};
