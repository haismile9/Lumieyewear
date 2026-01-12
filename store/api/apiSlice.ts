import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';

const API_URL = 'http://127.0.0.1:5002/api';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Products', 'Orders', 'Users', 'Addresses', 'Reviews', 'Wishlist', 'Pages', 'Settings', 'Cart'],
  endpoints: (builder) => ({
    // Cart
    getCart: builder.query({
      query: (params?: { sessionId?: string; cartId?: string }) => ({
        url: '/cart',
        params,
      }),
      providesTags: ['Cart'],
    }),

    addCartItem: builder.mutation({
      query: ({ cartId, productId, variantId, quantity }: { cartId: string; productId: string; variantId?: string; quantity: number }) => ({
        url: `/cart/${cartId}/items`,
        method: 'POST',
        body: { productId, variantId, quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    updateCartItem: builder.mutation({
      query: ({ cartId, itemId, quantity }: { cartId: string; itemId: string; quantity: number }) => ({
        url: `/cart/${cartId}/items/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    removeCartItem: builder.mutation({
      query: ({ cartId, itemId }: { cartId: string; itemId: string }) => ({
        url: `/cart/${cartId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    clearCart: builder.mutation({
      query: (cartId: string) => ({
        url: `/cart/${cartId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // Products
    getProducts: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string }) => ({
        url: '/products',
        params,
      }),
      providesTags: ['Products'],
    }),

    getProductByHandle: builder.query({
      query: (handle: string) => `/products/handle/${handle}`,
      providesTags: ['Products'],
    }),

    // Orders
    getOrders: builder.query({
      query: (params?: { page?: number; limit?: number; status?: string }) => ({
        url: '/orders',
        params,
      }),
      providesTags: ['Orders'],
    }),

    getOrderById: builder.query({
      query: (id: string) => `/orders/${id}`,
      providesTags: ['Orders'],
    }),

    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Orders'],
    }),

    updateOrderStatus: builder.mutation({
      query: ({ id, status }: { id: string; status: string }) => ({
        url: `/orders/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Orders'],
    }),

    // Users (Admin)
    getUsers: builder.query({
      query: (params?: { page?: number; limit?: number; role?: string; search?: string }) => ({
        url: '/users',
        params,
      }),
      providesTags: ['Users'],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, role }: { id: string; role: string }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['Users'],
    }),

    deleteUser: builder.mutation({
      query: (id: string) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),

    // Addresses
    getAddresses: builder.query({
      query: () => '/addresses',
      providesTags: ['Addresses'],
    }),

    createAddress: builder.mutation({
      query: (address) => ({
        url: '/addresses',
        method: 'POST',
        body: address,
      }),
      invalidatesTags: ['Addresses'],
    }),

    updateAddress: builder.mutation({
      query: ({ id, ...address }) => ({
        url: `/addresses/${id}`,
        method: 'PUT',
        body: address,
      }),
      invalidatesTags: ['Addresses'],
    }),

    deleteAddress: builder.mutation({
      query: (id: string) => ({
        url: `/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addresses'],
    }),

    // Reviews
    getProductReviews: builder.query({
      query: (productId: string) => `/reviews/product/${productId}`,
      providesTags: ['Reviews'],
    }),

    createReview: builder.mutation({
      query: (review) => ({
        url: '/reviews',
        method: 'POST',
        body: review,
      }),
      invalidatesTags: ['Reviews'],
    }),

    // Wishlist
    getWishlist: builder.query({
      query: (params?: { page?: number; limit?: number }) => ({
        url: '/wishlist',
        params,
      }),
      providesTags: ['Wishlist'],
    }),

    addToWishlist: builder.mutation({
      query: (productId: string) => ({
        url: '/wishlist',
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['Wishlist'],
    }),

    removeFromWishlist: builder.mutation({
      query: (productId: string) => ({
        url: `/wishlist/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
    }),

    // Pages (CMS)
    getPages: builder.query({
      query: (params?: { page?: number; limit?: number; search?: string }) => ({
        url: '/pages',
        params,
      }),
      providesTags: ['Pages'],
    }),

    getPageBySlug: builder.query({
      query: (slug: string) => `/pages/slug/${slug}`,
      providesTags: ['Pages'],
    }),

    createPage: builder.mutation({
      query: (page) => ({
        url: '/pages',
        method: 'POST',
        body: page,
      }),
      invalidatesTags: ['Pages'],
    }),

    updatePage: builder.mutation({
      query: ({ id, ...page }) => ({
        url: `/pages/${id}`,
        method: 'PUT',
        body: page,
      }),
      invalidatesTags: ['Pages'],
    }),

    deletePage: builder.mutation({
      query: (id: string) => ({
        url: `/pages/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Pages'],
    }),

    // Settings
    getSettings: builder.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),

    createSetting: builder.mutation({
      query: (setting) => ({
        url: '/settings',
        method: 'POST',
        body: setting,
      }),
      invalidatesTags: ['Settings'],
    }),

    updateSetting: builder.mutation({
      query: ({ id, ...setting }) => ({
        url: `/settings/${id}`,
        method: 'PUT',
        body: setting,
      }),
      invalidatesTags: ['Settings'],
    }),

    deleteSetting: builder.mutation({
      query: (id: string) => ({
        url: `/settings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  // Cart
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  // Products
  useGetProductsQuery,
  useGetProductByHandleQuery,
  // Orders
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  // Users
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  // Addresses
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  // Reviews
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  // Wishlist
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  // Pages
  useGetPagesQuery,
  useGetPageBySlugQuery,
  useCreatePageMutation,
  useUpdatePageMutation,
  useDeletePageMutation,
  // Settings
  useGetSettingsQuery,
  useCreateSettingMutation,
  useUpdateSettingMutation,
  useDeleteSettingMutation,
} = apiSlice;
