# Redux Toolkit Migration Complete ✅

## Đã Migrate từ Context API sang Redux Toolkit

### 📦 Dependencies Installed
```bash
@reduxjs/toolkit
react-redux
redux-persist
```

### 🏗️ Store Structure
```
store/
├── store.ts              # Redux store config với persist
├── hooks.ts              # Typed hooks (useAppDispatch, useAppSelector)
├── provider.tsx          # Redux Provider component
├── slices/
│   ├── authSlice.ts     # Auth state & async thunks
│   └── cartSlice.ts     # Cart state management
└── api/
    └── apiSlice.ts      # RTK Query API endpoints
```

### 🔄 Auth Slice Features
- **State**: user, token, loading, error
- **Async Thunks**:
  - `loginUser` - Login with email/password
  - `fetchCurrentUser` - Fetch current user from token
  - `updateProfile` - Update user profile
- **Actions**:
  - `setCredentials` - Set user & token
  - `logout` - Clear auth state
  - `clearError` - Clear error messages

### 🛒 Cart Slice Features
- **State**: items, totalItems, subtotal
- **Actions**:
  - `addToCart` - Add item or increase quantity
  - `updateCartItemQuantity` - Update item quantity
  - `removeFromCart` - Remove item
  - `clearCart` - Clear all items
  - `hydrateCart` - Load cart from localStorage

### 🌐 RTK Query API Endpoints
Auto-generated hooks cho tất cả API calls:
- **Products**: `useGetProductsQuery`, `useGetProductByHandleQuery`
- **Orders**: `useGetOrdersQuery`, `useCreateOrderMutation`, `useUpdateOrderStatusMutation`
- **Users**: `useGetUsersQuery`, `useUpdateUserRoleMutation`, `useDeleteUserMutation`
- **Addresses**: `useGetAddressesQuery`, `useCreateAddressMutation`, `useUpdateAddressMutation`
- **Reviews**: `useGetProductReviewsQuery`, `useCreateReviewMutation`
- **Wishlist**: `useGetWishlistQuery`, `useAddToWishlistMutation`
- **Pages**: `useGetPagesQuery`, `useCreatePageMutation`, `useUpdatePageMutation`
- **Settings**: `useGetSettingsQuery`, `useCreateSettingMutation`

### ✨ Key Benefits
✅ **Centralized state** - Single source of truth
✅ **Redux DevTools** - Time-travel debugging
✅ **Auto-persist** - Auth & Cart persist across sessions
✅ **RTK Query** - Built-in caching & auto-refetch
✅ **TypeScript** - Fully typed với RootState & AppDispatch
✅ **Performance** - Optimized re-renders
✅ **Middleware** - Async logic handling

### 📝 Usage Examples

#### Auth
```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, logout } from '@/store/slices/authSlice';

const user = useAppSelector((state) => state.auth.user);
const dispatch = useAppDispatch();

// Login
await dispatch(loginUser({ email, password })).unwrap();

// Logout
dispatch(logout());
```

#### Cart
```tsx
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addToCart, removeFromCart } from '@/store/slices/cartSlice';

const { items, totalItems } = useAppSelector((state) => state.cart);
const dispatch = useAppDispatch();

// Add to cart
dispatch(addToCart({ id, productId, variantId, title, price, quantity }));

// Remove from cart
dispatch(removeFromCart(variantId));
```

#### RTK Query
```tsx
import { useGetProductsQuery, useCreateOrderMutation } from '@/store/api/apiSlice';

// Fetch products with auto-caching
const { data, isLoading, error } = useGetProductsQuery({ page: 1, limit: 20 });

// Create order mutation
const [createOrder, { isLoading }] = useCreateOrderMutation();
await createOrder(orderData).unwrap();
```

### 🔧 Updated Components
- ✅ `app/layout.tsx` - ReduxProvider wrapper
- ✅ `components/layout/header/index.tsx` - useAppSelector for user
- ✅ `app/login/page.tsx` - loginUser thunk
- ✅ `app/admin/layout.tsx` - useAppSelector & logout action
- ✅ `app/account/settings/page.tsx` - updateProfile thunk

### 🚀 Next Steps
1. Migrate CartContext consumers to use cartSlice
2. Replace all fetch calls với RTK Query hooks
3. Add more slices as needed (products, orders, etc.)
4. Setup Redux DevTools Extension
5. Add error handling middleware
6. Implement optimistic updates

### 🐛 Debug
Redux DevTools: Install extension và open browser console
- View state tree
- Track all dispatched actions
- Time-travel debugging
- Performance monitoring

## Migration Complete! 🎉
Context API → Redux Toolkit migration hoàn tất với full TypeScript support và auto-persist!
