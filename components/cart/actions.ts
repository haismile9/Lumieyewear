'use server';

import { TAGS } from '@/lib/constants';
import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import {
  createCart as createBackendCart,
  addCartLines as addBackendCartLines,
  updateCartLines as updateBackendCartLines,
  removeCartLines as removeBackendCartLines,
} from '@/lib/api/index-backend';
import backendAPI from '@/lib/api/backend-api';
import type { Cart } from '@/lib/api/types';

const CART_COOKIE = 'cartId';

// Get or create cart ID
async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  let cartId = cookieStore.get(CART_COOKIE)?.value;
  
  // Check if cartId is in old Shopify format (contains "gid://shopify/")
  // If so, clear it and create a new backend cart
  if (cartId && cartId.includes('gid://shopify/')) {
    console.log('Clearing old Shopify cart ID:', cartId);
    cartId = undefined;
  }
  
  if (!cartId) {
    const sessionId = Math.random().toString(36).substring(7);
    const response = await backendAPI.createCart(sessionId);
    const newCartId = response.data.id;
    
    cookieStore.set(CART_COOKIE, newCartId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    
    console.log('Created new backend cart ID:', newCartId);
    return newCartId;
  }
  
  return cartId;
}

// Transform backend cart to frontend Cart type
function transformCart(backendCart: any): Cart {
  return {
    id: backendCart.id,
    checkoutUrl: `/checkout/${backendCart.id}`,
    cost: {
      subtotalAmount: {
        amount: backendCart.totalPrice?.toString() || '0',
        currencyCode: 'VND',
      },
      totalAmount: {
        amount: backendCart.totalPrice?.toString() || '0',
        currencyCode: 'VND',
      },
      totalTaxAmount: {
        amount: '0',
        currencyCode: 'VND',
      },
    },
    lines: (backendCart.items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      cost: {
        totalAmount: {
          amount: (item.price * item.quantity).toString(),
          currencyCode: 'VND',
        },
      },
      merchandise: {
        id: item.variantId || item.productId,
        title: item.variant?.title || item.product?.title || '',
        selectedOptions: item.variant?.selectedOptions || [],
        product: {
          id: item.product.id,
          handle: item.product.handle,
          title: item.product.title,
          categoryId: item.product.categoryId,
          description: item.product.description || '',
          descriptionHtml: item.product.descriptionHtml || '',
          featuredImage: item.product.images?.[0] ? {
            url: item.product.images[0].url,
            altText: item.product.images[0].altText || item.product.title,
            width: item.product.images[0].width || 800,
            height: item.product.images[0].height || 800,
          } : {
            url: '',
            altText: item.product.title,
            width: 800,
            height: 800,
          },
          currencyCode: 'VND',
          priceRange: {
            minVariantPrice: {
              amount: item.price.toString(),
              currencyCode: 'VND',
            },
            maxVariantPrice: {
              amount: item.price.toString(),
              currencyCode: 'VND',
            },
          },
          seo: {
            title: item.product.title,
            description: item.product.description || '',
          },
          options: [],
          tags: item.product.tags || [],
          variants: [],
          images: item.product.images || [],
          availableForSale: true,
        },
        price: {
          amount: item.price.toString(),
          currencyCode: 'VND',
        },
      },
    })),
    totalQuantity: backendCart.totalItems || 0,
  };
}

// Get cart
export async function getCart(): Promise<Cart | null> {
  try {
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    
    if (!cartId) {
      return null;
    }
    
    // Backend expects sessionId or userId for GET /cart
    // We use cartId as sessionId since we store cartId in cookie
    const response = await backendAPI.getCart(cartId);
    return transformCart(response.data);
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

// Create cart and set cookie
export async function createCartAndSetCookie(): Promise<Cart | null> {
  try {
    const sessionId = Math.random().toString(36).substring(7);
    const response = await backendAPI.createCart(sessionId);
    
    (await cookies()).set(CART_COOKIE, response.data.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    
    return transformCart(response.data);
  } catch (error) {
    console.error('Error creating cart:', error);
    return null;
  }
}

// Add item to cart
export async function addItem(variantId: string | undefined, productId: string | undefined): Promise<Cart | null> {
  if (!variantId || !productId) return null;
  
  try {
    const cartId = await getOrCreateCartId();
    console.log('Cart ID:', cartId);
    console.log('Adding item:', { productId, variantId });
    
    // Add item to cart
    const response = await backendAPI.addToCart(cartId, {
      productId: productId,
      variantId: variantId,
      quantity: 1,
    });
    
    console.log('Add item response:', JSON.stringify(response, null, 2));
    
    revalidateTag(TAGS.cart);
    const cart = transformCart(response.data);
    console.log('Transformed cart:', JSON.stringify(cart, null, 2));
    return cart;
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return null;
  }
}

// Update cart item quantity
export async function updateItem({ lineId, quantity }: { 
  lineId: string; 
  quantity: number 
}): Promise<Cart | null> {
  try {
    const cartId = (await cookies()).get(CART_COOKIE)?.value;
    if (!cartId) return null;
    
    const response = await backendAPI.updateCartItem(cartId, lineId, quantity);
    
    revalidateTag(TAGS.cart);
    return transformCart(response.data);
  } catch (error) {
    console.error('Error updating item:', error);
    return null;
  }
}

