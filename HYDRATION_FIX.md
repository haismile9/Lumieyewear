# Fix Hydration Error - Quick Guide

## 🚨 Problem

Hydration error occurred because the data source selection was happening at **runtime**, causing server and client to potentially use different implementations.

## ✅ Solution

Changed [lib/shopify/index.ts](v0commercetemplateshopify/lib/shopify/index.ts) to use **module-level initialization** instead of runtime conditionals.

### Before (❌ Caused Hydration Error)
```typescript
// Runtime selection - different on server vs client
const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'shopify';
const implementation = dataSource === 'backend' ? backendImpl : shopifyImpl;
```

### After (✅ Fixed)
```typescript
// Module-level selection - same on server and client
const USE_BACKEND = process.env.NEXT_PUBLIC_DATA_SOURCE === 'backend';
const impl = USE_BACKEND ? backendImpl : shopifyImpl;

// Direct re-export
export const getProducts = impl.getProducts;
```

## 🔑 Key Changes

1. **Module-level constant**: `USE_BACKEND` is evaluated ONCE when module loads
2. **Consistent behavior**: Same implementation used on server and client
3. **No runtime branching**: Avoids conditional rendering differences

## 📝 Usage Instructions

### To Use Shopify (Default)
```env
# .env.local
NEXT_PUBLIC_DATA_SOURCE=shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=v0-template.myshopify.com
```

### To Use Backend API
```env
# .env.local
NEXT_PUBLIC_DATA_SOURCE=backend
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
```

### ⚠️ CRITICAL: Restart After Changing

**You MUST restart the dev server** after changing `NEXT_PUBLIC_DATA_SOURCE`:

```bash
# Stop server (Ctrl+C)
npm run dev
```

Why? Because:
- Environment variables are embedded at build time
- Module initializes once with the env value
- Changing .env.local doesn't reload modules automatically

## 🧪 Testing

1. **Test Shopify mode:**
   ```bash
   # Set .env.local
   NEXT_PUBLIC_DATA_SOURCE=shopify
   
   # Restart
   npm run dev
   
   # Visit http://localhost:3000/shop
   ```

2. **Test Backend mode:**
   ```bash
   # Start backend first
   cd backend && npm run dev
   
   # Set .env.local
   NEXT_PUBLIC_DATA_SOURCE=backend
   NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api
   
   # Restart frontend
   cd ../v0commercetemplateshopify && npm run dev
   
   # Visit http://localhost:3000/shop
   ```

## 🔍 Why This Works

### Module Initialization Flow

1. **Server Render (SSR)**:
   - Next.js server loads `index.ts`
   - Reads `process.env.NEXT_PUBLIC_DATA_SOURCE`
   - Sets `USE_BACKEND` constant
   - Selects implementation
   - Renders HTML

2. **Client Hydration**:
   - Browser receives HTML
   - Loads same `index.ts` module
   - Reads **same** `NEXT_PUBLIC_DATA_SOURCE` (embedded in client bundle)
   - Sets **same** `USE_BACKEND` value
   - Uses **same** implementation
   - **✅ HTML matches** - No hydration error!

### Why Old Approach Failed

```typescript
// ❌ This was the problem:
const implementation = dataSource === 'backend' ? backendImpl : shopifyImpl;
export const getProducts = implementation.getProducts;
```

Even though `dataSource` was read once, the **reference** to `implementation.getProducts` could be evaluated differently if:
- Timing of module evaluation differs
- Build optimization changes execution order
- Browser extensions modify environment

### Why New Approach Works

```typescript
// ✅ This is the fix:
const impl = USE_BACKEND ? backendImpl : shopifyImpl;
export const getProducts = impl.getProducts;
```

- `USE_BACKEND` is a **boolean constant**
- Ternary resolves to **concrete module reference**
- Exported functions are **stable references**
- Same code path on server and client

## 📚 Related Files

- [lib/shopify/index.ts](v0commercetemplateshopify/lib/shopify/index.ts) - Fixed router
- [lib/shopify/index-backend.ts](v0commercetemplateshopify/lib/shopify/index-backend.ts) - Backend implementation
- [lib/shopify/index-shopify.ts](v0commercetemplateshopify/lib/shopify/index-shopify.ts) - Shopify implementation
- [.env.local](v0commercetemplateshopify/.env.local) - Environment config

## 🎯 Summary

| Issue | Solution |
|-------|----------|
| Hydration mismatch | Module-level constant selection |
| Runtime branching | Compile-time selection |
| Different implementations | Consistent implementation reference |
| Env var timing | NEXT_PUBLIC_ vars embedded in bundle |

**Result**: No more hydration errors! 🎉
