'use client';

import type { CartItem } from '@/store/slices/cartSlice';
import Image from 'next/image';
import Link from 'next/link';
import { DeleteItemButton } from './delete-item-button';
import { EditItemQuantityButton } from './edit-item-quantity-button';
import { formatPrice } from '@/lib/shopify/utils';

interface CartItemProps {
  item: CartItem;
  onCloseCart: () => void;
}

export function CartItemCard({ item, onCloseCart }: CartItemProps) {
  const productUrl = `/product/${item.handle}`;

  return (
    <div className="bg-popover rounded-lg p-2">
      <div className="flex flex-row gap-6">
        <div className="relative size-[120px] overflow-hidden rounded-sm shrink-0">
          <Image
            className="size-full object-cover"
            width={240}
            height={240}
            alt={item.title}
            src={item.imageUrl || '/placeholder.png'}
          />
        </div>
        <div className="flex flex-col gap-2 2xl:gap-3 flex-1">
          <Link href={productUrl} onClick={onCloseCart} className="z-30 flex flex-col justify-center" prefetch>
            <span className="2xl:text-lg font-semibold">{item.title}</span>
            {item.variantTitle && (
              <span className="text-sm text-muted-foreground">{item.variantTitle}</span>
            )}
          </Link>
          <p className="2xl:text-lg font-semibold">
            {formatPrice((item.price * item.quantity).toString(), 'USD')}
          </p>
          <div className="flex justify-between items-end mt-auto">
            <div className="flex h-8 flex-row items-center rounded-md border border-neutral-200">
              <EditItemQuantityButton item={item} type="minus" />
              <span className="w-8 text-center text-sm">{item.quantity}</span>
              <EditItemQuantityButton item={item} type="plus" />
            </div>
            <DeleteItemButton item={item} />
          </div>
        </div>
      </div>
    </div>
  );
}
