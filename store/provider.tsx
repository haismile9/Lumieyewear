'use client';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { useEffect } from 'react';
import { fetchCurrentUser } from './slices/authSlice';
import { setCart } from './slices/cartSlice';
import { getOrCreateSessionId, getStoredCartId, storeCartId, transformCartResponse } from '@/lib/cart-utils';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Expose Redux state to window for backend-api.ts to access
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.__REDUX_STATE__ = store.getState();
      
      // Update window.__REDUX_STATE__ whenever store changes
      const unsubscribe = store.subscribe(() => {
        // @ts-ignore
        window.__REDUX_STATE__ = store.getState();
      });

      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    // Fetch user on app load if token exists
    const state = store.getState();
    if (state.auth.token && !state.auth.user) {
      store.dispatch(fetchCurrentUser());
    }

    // Initialize cart from backend
    const initCart = async () => {
      try {
        const cartId = getStoredCartId();
        const sessionId = getOrCreateSessionId();
        
        const params = new URLSearchParams();
        if (cartId) params.append('cartId', cartId);
        else if (sessionId) params.append('sessionId', sessionId);

        const response = await fetch(`http://127.0.0.1:5002/api/cart?${params}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const cartData = transformCartResponse(result.data);
            store.dispatch(setCart(cartData));
            storeCartId(cartData.cartId);
          }
        }
      } catch (error) {
        console.error('Failed to initialize cart:', error);
      }
    };

    initCart();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
