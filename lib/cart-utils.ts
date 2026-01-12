// Cart utility functions for localStorage management and data transformation

const CART_ID_KEY = 'lumi_cart_id';
const SESSION_ID_KEY = 'lumi_session_id';

/**
 * Generate and store session ID if not exists
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get stored cart ID
 */
export function getStoredCartId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_ID_KEY);
}

/**
 * Store cart ID
 */
export function storeCartId(cartId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_ID_KEY, cartId);
}

/**
 * Clear cart storage
 */
export function clearCartStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_ID_KEY);
}

/**
 * Transform backend cart item to Redux format
 */
export function transformCartItem(item: any) {
  return {
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    title: item.product?.title || 'Unknown Product',
    variantTitle: item.variant?.title,
    price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
    quantity: item.quantity,
    imageUrl: item.product?.images?.[0]?.url || item.product?.images?.[0]?.src,
    handle: item.product?.handle || '',
  };
}

/**
 * Transform backend cart response to Redux cart state
 */
export function transformCartResponse(data: any) {
  return {
    cartId: data.id,
    sessionId: data.sessionId,
    items: data.items?.map(transformCartItem) || [],
  };
}

/**
 * Get product ID from Shopify-style ID (extract number)
 */
export function extractProductId(shopifyId: string): string {
  // Extract last segment after last slash
  const parts = shopifyId.split('/');
  return parts[parts.length - 1];
}
