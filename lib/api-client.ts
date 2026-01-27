// API client utilities for LUMI Web

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5002/api';
const IMAGE_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://127.0.0.1:5002';

// Helper to get full image URL
export function getImageUrl(url: string): string {
  if (!url) return '';
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // Prepend base URL for relative paths
  return `${IMAGE_BASE_URL}${url}`;
}

// Helper to get auth token from Redux Persist storage
const getToken = () => {
  if (typeof window !== 'undefined') {
    try {
      // Try to get token from Redux Persist first
      const persistRoot = localStorage.getItem('persist:root');
      if (persistRoot) {
        const parsed = JSON.parse(persistRoot);
        if (parsed.auth) {
          const authState = JSON.parse(parsed.auth);
          if (authState.token) {
            return authState.token;
          }
        }
      }
      // Fallback to direct localStorage token (for backward compatibility)
      return localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }
  return null;
};

// Helper for API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 [API] Authenticated request to:', endpoint);
  }
  
  console.log('📡 [API] Request:', options.method || 'GET', endpoint);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

// ========== Authentication APIs ==========

export const authApi = {
  // Login
  login: async (email: string, password: string) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Register
  register: async (data: { email: string; password: string; name: string; phone?: string }) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get current user
  getMe: async () => {
    return apiRequest('/auth/me');
  },

  // Logout
  logout: async () => {
    return apiRequest('/auth/logout', { method: 'POST' });
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string) => {
    return apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  // Verify email
  verifyEmail: async (token: string) => {
    return apiRequest('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Resend verification email
  resendVerification: async () => {
    return apiRequest('/auth/resend-verification', { method: 'POST' });
  },

  // Refresh token
  refreshToken: async () => {
    return apiRequest('/auth/refresh', { method: 'POST' });
  },

  // Get user sessions
  getSessions: async () => {
    return apiRequest('/auth/sessions');
  },

  // Revoke session
  revokeSession: async (sessionId: string) => {
    return apiRequest(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
  },

  // Update profile
  updateProfile: async (data: { name?: string; email?: string; phone?: string }) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

// ========== Pages (CMS) APIs ==========

export const pagesApi = {
  // Get page by handle (public)
  getByHandle: async (handle: string) => {
    return apiRequest(`/pages/${handle}`);
  },

  // Get all pages (admin)
  getAll: async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/pages?${query}`);
  },
};

// ========== Orders APIs ==========

export const ordersApi = {
  // Get my orders
  getMyOrders: async (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/orders/me?${query}`);
  },

  // Get order by number
  getByNumber: async (orderNumber: string) => {
    return apiRequest(`/orders/number/${orderNumber}`);
  },

  // Create order
  createOrder: async (orderData: any) => {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason: string) => {
    return apiRequest(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// ========== Addresses APIs ==========

export const addressesApi = {
  // Get all addresses
  getAll: async () => {
    return apiRequest('/addresses');
  },

  // Get address by ID
  getById: async (id: string) => {
    return apiRequest(`/addresses/${id}`);
  },

  // Create address
  create: async (data: any) => {
    return apiRequest('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update address
  update: async (id: string, data: any) => {
    return apiRequest(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete address
  delete: async (id: string) => {
    return apiRequest(`/addresses/${id}`, { method: 'DELETE' });
  },

  // Set default address
  setDefault: async (id: string) => {
    return apiRequest(`/addresses/${id}/default`, { method: 'PATCH' });
  },
};

// ========== Wishlist APIs ==========

export const wishlistApi = {
  // Get wishlist
  getAll: async (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/wishlist?${query}`);
  },

  // Add to wishlist
  add: async (productId: string) => {
    return apiRequest('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    });
  },

  // Remove from wishlist
  remove: async (productId: string) => {
    return apiRequest(`/wishlist/${productId}`, { method: 'DELETE' });
  },

  // Check if in wishlist
  check: async (productId: string) => {
    return apiRequest(`/wishlist/check/${productId}`);
  },

  // Clear wishlist
  clear: async () => {
    return apiRequest('/wishlist', { method: 'DELETE' });
  },
};

// ========== Reviews APIs ==========

export const reviewsApi = {
  // Get my reviews
  getMyReviews: async (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/reviews/me?${query}`);
  },

  // Get product reviews
  getProductReviews: async (productId: string, params?: any) => {
    const query = new URLSearchParams(params as any).toString();
    return apiRequest(`/reviews/product/${productId}?${query}`);
  },

  // Create review
  create: async (data: {
    productId: string;
    rating: number;
    title: string;
    content: string;
    images?: string[];
  }) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update review
  update: async (id: string, data: any) => {
    return apiRequest(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete review
  delete: async (id: string) => {
    return apiRequest(`/reviews/${id}`, { method: 'DELETE' });
  },

  // Mark review helpful
  markHelpful: async (id: string, helpful: boolean) => {
    return apiRequest(`/reviews/${id}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  },

  // Upload review photos
  uploadPhotos: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('photos', file);
    });

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/reviews/upload-photos`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  // Check review status for products
  checkStatus: async (productIds: string[]) => {
    return apiRequest('/reviews/check-status', {
      method: 'POST',
      body: JSON.stringify({ productIds }),
    });
  },
};

// ========== Settings APIs (Admin) ==========

export const settingsApi = {
  // Get all settings
  getAll: async () => {
    return apiRequest('/settings');
  },

  // Get setting by key
  getByKey: async (key: string) => {
    return apiRequest(`/settings/${key}`);
  },
};

export default {
  auth: authApi,
  pages: pagesApi,
  orders: ordersApi,
  addresses: addressesApi,
  wishlist: wishlistApi,
  reviews: reviewsApi,
  settings: settingsApi,
};

