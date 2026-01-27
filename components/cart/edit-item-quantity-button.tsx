'use client';

import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';
import type { CartItem } from '@/store/slices/cartSlice';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useUpdateCartItemMutation, useRemoveCartItemMutation } from '@/store/api/apiSlice';
import { setCart } from '@/store/slices/cartSlice';
import { transformCartResponse } from '@/lib/cart-utils';
import { toast } from 'sonner';

function SubmitButton({ type }: { type: 'plus' | 'minus' }) {
  return (
    <button
      type="submit"
      aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
      className={clsx(
        'ease flex h-full min-w-[36px] max-w-[36px] flex-none items-center justify-center rounded-full p-2 transition-all duration-200 hover:border-neutral-800 hover:opacity-80',
        {
          'ml-auto': type === 'minus',
        }
      )}
    >
      {type === 'plus' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
    </button>
  );
}

export function EditItemQuantityButton({ item, type }: { item: CartItem; type: 'plus' | 'minus' }) {
  const dispatch = useAppDispatch();
  const cartId = useAppSelector((state) => state.cart.cartId);
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();
  const nextQuantity = type === 'plus' ? item.quantity + 1 : item.quantity - 1;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartId) return;

    try {
      if (nextQuantity === 0) {
        // Remove item if quantity becomes 0
        const result = await removeCartItem({ cartId, itemId: item.id }).unwrap();
        if (result.success && result.data) {
          const cartData = transformCartResponse(result.data);
          dispatch(setCart(cartData));
        }
      } else {
        // Update quantity
        const result = await updateCartItem({ cartId, itemId: item.id, quantity: nextQuantity }).unwrap();
        if (result.success && result.data) {
          const cartData = transformCartResponse(result.data);
          dispatch(setCart(cartData));
        }
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update cart');
    }
  };

  return (
    <form onSubmit={handleUpdate}>
      <SubmitButton type={type} />
    </form>
  );
}

