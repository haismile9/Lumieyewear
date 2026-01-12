'use client';

import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/shopify/types';
import { AddToCart, AddToCartButton } from '../cart/add-to-cart';
import { Suspense } from 'react';
import Link from 'next/link';
import { VariantSelector } from './variant-selector';

export function FeaturedProductLabel({
  product,
  principal = false,
  className,
}: {
  product: Product;
  principal?: boolean;
  className?: string;
}) {
  if (principal) {
    return (
      <div
        className={cn(
          'flex flex-col grid-cols-2 gap-y-3 p-4 w-full bg-white md:w-fit md:rounded-md md:grid',
          className
        )}
      >
        <div className="col-span-2">
          <Badge className="font-black capitalize rounded-full">Best Seller</Badge>
        </div>
        <Link href={`/product/${product.handle}`} className="col-span-1 self-start text-2xl font-semibold">
          {product.title}
        </Link>
        <div className="col-span-1 mb-10">
          {product.tags.length > 0 ? (
            <p className="mb-3 text-sm italic font-medium">{product.tags.join('. ')}</p>
          ) : null}
          <p className="text-sm font-medium line-clamp-3">{product.description}</p>
        </div>
         <div className="flex col-span-1 gap-3 items-center text-2xl font-semibold">
          ${Number(product.priceRange.minVariantPrice.amount)}
          {product.compareAtPrice && (
            <span className="line-through opacity-30">${Number(product.compareAtPrice.amount)}</span>
          )}
        </div>
        <div className="col-span-1">
          {product.options && product.options.length > 0 && (
            <VariantSelector options={product.options} variants={product.variants} product={product} />
          )}
        </div>
        <Suspense
          fallback={<AddToCartButton className="flex gap-20 justify-between pr-2" size="lg" product={product} variant="default" />}
        >
          <AddToCart className="flex gap-20 justify-between pr-2" size="lg" product={product} variant="default" />
        </Suspense>
        
       
        
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3 p-3 bg-white rounded-md max-w-full', className)}>
      <div className="flex gap-2 items-center">
        <div className="pr-6 leading-4 overflow-hidden flex-1">
          <Link
            href={`/product/${product.handle}`}
            className="inline-block w-full truncate text-base font-semibold opacity-80 mb-1.5"
          >
            {product.title}
          </Link>
          <div className="flex gap-2 items-center text-base font-semibold">
            ${Number(product.priceRange.minVariantPrice.amount)}
            {product.compareAtPrice && (
              <span className="text-sm line-through opacity-30">${Number(product.compareAtPrice.amount)}</span>
            )}
          </div>
        </div>
        <Suspense fallback={<AddToCartButton product={product} iconOnly variant="default" size="icon-lg" />}>
          <AddToCart product={product} iconOnly variant="default" size="icon-lg" />
        </Suspense>
      </div>
      {product.options && product.options.length > 0 && (
        <div className="w-full">
          <VariantSelector options={product.options} variants={product.variants} product={product} variant="condensed" />
        </div>
      )}
    </div>
  );
}
