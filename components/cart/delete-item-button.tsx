'use client';

import type { CartItem } from '@/store/slices/cartSlice';
import { Button } from '../ui/button';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useRemoveCartItemMutation } from '@/store/api/apiSlice';
import { setCart } from '@/store/slices/cartSlice';
import { transformCartResponse } from '@/lib/cart-utils';
import { toast } from 'sonner';

export function DeleteItemButton({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const cartId = useAppSelector((state) => state.cart.cartId);
  const [removeCartItem] = useRemoveCartItemMutation();

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartId) return;

    try {
      const result = await removeCartItem({ cartId, itemId: item.id }).unwrap();
      if (result.success && result.data) {
        const cartData = transformCartResponse(result.data);
        dispatch(setCart(cartData));
        toast.success('Item removed from cart');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to remove item');
    }
  };

  return (
    <form className="-mr-1 -mb-1 opacity-70" onSubmit={handleRemove}>
      <Button type="submit" size="sm" variant="ghost" aria-label="Remove item" className="px-2 text-sm">
        Remove
      </Button>
    </form>
  );
}

