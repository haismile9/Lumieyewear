// Backend API Client for LUMI Web
// Replace Shopify API with our own backend

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5001/api';

// Helper to get auth token from Redux store (in-memory, faster and more reliable)
const getToken = () => {
  if (typeof window !== 'undefined') {
    try {
      // Try to get token from Redux Persist localStorage
      const persistRoot = localStorage.getItem('persist:root');
      if (persistRoot) {
        const parsed = JSON.parse(persistRoot);
        if (parsed.auth) {
          const authState = JSON.parse(parsed.auth);
          if (authState.token) {
            console.log('✅ [getToken] Token found in Redux persist:', authState.token.substring(0, 20) + '...');
            return authState.token;
          }
        }
      }
      
      // Fallback: direct localStorage token (for backward compatibility)
      const directToken = localStorage.getItem('token');
      if (directToken) {
        console.log('✅ [getToken] Token found in direct localStorage');
        return directToken;
      }

      console.log('⚠️  [getToken] No token found in any storage');
      return null;
    } catch (error) {
      console.error('❌ [getToken] Error getting token:', error);
      return null;
    }
  }
  return null;
};

// Generic fetch wrapper for backend API
async function backendFetch<T>(
  endpoint: string,
  options?: RequestInit & { requiresAuth?: boolean }
): Promise<T> {
  try {
    const url = `${BACKEND_API_URL}${endpoint}`;
    const token = getToken();
    const requiresAuth = options?.requiresAuth ?? false;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 [backendAPI] Authenticated request to:', endpoint);
    } else if (requiresAuth) {
      console.warn('⚠️  [backendAPI] Auth required but no token found for:', endpoint);
    }
    // Removed warning for public endpoints to reduce noise
    
    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 60 }, // ISR - revalidate every 60 seconds
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Backend API HTTP error! Status: ${response.status}, Body: ${errorBody}`);
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Backend fetch error:', error);
    throw error;
  }
}

// Build query string from params
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// Products API
export const backendAPI = {
  // Get all products with filters
  async getProducts(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    q?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    isFeatured?: boolean;
  }) {
    const queryString = buildQueryString(params || {});
    return backendFetch<{
      data: any[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/products${queryString}`);
  },

  // Get featured products
  async getFeaturedProducts(limit: number = 10) {
    return backendFetch<{ data: any[]; total: number }>(`/products/featured?limit=${limit}`);
  },

  // Search products
  async searchProducts(query: string, params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const queryString = buildQueryString({ q: query, ...params });
    return backendFetch<{
      query: string;
      data: any[];
      pagination: any;
    }>(`/products/search${queryString}`);
  },

  // Get product by handle
  async getProduct(handle: string) {
    return backendFetch<any>(`/products/${handle}`);
  },

  // Get product by ID
  async getProductById(id: string) {
    return backendFetch<any>(`/products/id/${id}`);
  },

  // Get product variants
  async getProductVariants(productId: string) {
    return backendFetch<{ data: any[] }>(`/products/${productId}/variants`);
  },

  // Check variant availability
  async checkVariantAvailability(variantIds: string[]) {
    return backendFetch<{ data: any[] }>(`/products/variants/check-availability`, {
      method: 'POST',
      body: JSON.stringify({ variantIds }),
    });
  },

  // Categories API
  async getCategories(params?: {
    includeHidden?: boolean;
    parentId?: string;
    level?: number;
  }) {
    const queryString = buildQueryString(params || {});
    return backendFetch<{ data: any[] }>(`/categories${queryString}`);
  },

  async getCategory(slug: string) {
    return backendFetch<any>(`/categories/${slug}`);
  },

  async getCategoryProducts(slug: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    includeChildren?: boolean;
  }) {
    const queryString = buildQueryString(params || {});
    return backendFetch<{
      category: any;
      data: any[];
      pagination: any;
    }>(`/categories/${slug}/products${queryString}`);
  },

  // Collections API
  async getCollections(params?: {
    isFeatured?: boolean;
    isVisible?: boolean;
  }) {
    const queryString = buildQueryString(params || {});
    return backendFetch<{ data: any[] }>(`/collections${queryString}`);
  },

  async getCollection(handle: string) {
    return backendFetch<any>(`/collections/${handle}`);
  },

  async getCollectionProducts(handle: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const queryString = buildQueryString(params || {});
    return backendFetch<{
      collection: any;
      data: any[];
      pagination: any;
    }>(`/collections/${handle}/products${queryString}`);
  },

  // Cart API
  async getCart(cartId?: string) {
    const queryString = cartId ? `?cartId=${cartId}` : '';
    return backendFetch<{ data: any }>(`/cart${queryString}`);
  },

  async createCart(sessionId?: string) {
    return backendFetch<{ data: any }>(`/cart`, {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  },

  async addToCart(cartId: string, item: {
    productId: string;
    variantId?: string;
    quantity: number;
  }) {
    return backendFetch<{ data: any }>(`/cart/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateCartItem(cartId: string, itemId: string, quantity: number) {
    return backendFetch<{ data: any }>(`/cart/${cartId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  async removeFromCart(cartId: string, itemId: string) {
    return backendFetch<{ data: any }>(`/cart/${cartId}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  async clearCart(cartId: string) {
    return backendFetch<{ success: boolean }>(`/cart/${cartId}`, {
      method: 'DELETE',
    });
  },

  async mergeCarts(sessionCartId: string, userCartId?: string) {
    return backendFetch<{ data: any }>(`/cart/merge`, {
      method: 'POST',
      body: JSON.stringify({ sessionCartId, userCartId }),
    });
  },

  // Orders API
  async createOrder(orderData: {
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
    }>;
    email: string;
    phone: string;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      country?: string;
      zip?: string;
    };
    billingAddress?: {
      firstName: string;
      lastName: string;
      address1: string;
      address2?: string;
      city: string;
      province?: string;
      country?: string;
      zip?: string;
    };
    paymentMethod: string;
    shippingMethod?: string;
    discountCode?: string;
    customerNote?: string;
  }) {
    return backendFetch<{ message: string; order: any }>(`/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getOrderByNumber(orderNumber: string, email: string) {
    return backendFetch<{ data: any }>(`/orders/number/${orderNumber}?email=${encodeURIComponent(email)}`);
  },
};

export default backendAPI;
