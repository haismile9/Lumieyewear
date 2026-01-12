# Frontend Integration Guide

## Quick Setup

### 1. Create .env.local file
```bash
cp .env.local.example .env.local
```

### 2. Configure Backend API
Edit `.env.local`:
```env
# Use backend API
NEXT_PUBLIC_DATA_SOURCE=backend
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api

# Or use Shopify (fallback)
# NEXT_PUBLIC_DATA_SOURCE=shopify
# NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
```

### 3. Start Backend Server
```bash
cd backend
npm run dev
```

### 4. Start Frontend
```bash
cd v0commercetemplateshopify
npm run dev
```

## What Changed

### New Files
- `lib/shopify/backend-api.ts` - Backend API client
- `lib/shopify/index-backend.ts` - Backend integration layer
- `.env.local.example` - Environment configuration template

### Modified Files
- `lib/shopify/index.ts` - Now routes between backend/shopify based on config

### Data Flow

```
Frontend Components
       ↓
lib/shopify/index.ts (Router)
       ↓
   Backend?  → YES → index-backend.ts → backend-api.ts → Backend API
       ↓
       NO → index-shopify.ts → shopify.ts → Shopify API
```

## API Mapping

### Products
- `getProducts()` → `GET /api/products`
- `getProduct(handle)` → `GET /api/products/:handle`
- `getCollectionProducts()` → `GET /api/collections/:handle/products`

### Collections
- `getCollections()` → `GET /api/collections`
- `getCollection(handle)` → `GET /api/collections/:handle`

### Categories (New)
Available via backend-api.ts:
- `backendAPI.getCategories()`
- `backendAPI.getCategory(slug)`
- `backendAPI.getCategoryProducts(slug)`

## Testing

### 1. Test Backend Connection
```bash
curl http://localhost:5001/health
```

### 2. Test Products API
```bash
curl http://localhost:5001/api/products
```

### 3. Check Frontend
```bash
# Visit
http://localhost:3000/shop
http://localhost:3000/product/[product-handle]
```

## Troubleshooting

### "Failed to fetch"
- Check backend server is running on port 5001
- Check NEXT_PUBLIC_BACKEND_API_URL is correct
- Check CORS is enabled in backend

### "No products showing"
- Seed backend database: `npm run seed`
- Check backend logs for errors
- Try fetching directly: `curl http://localhost:5001/api/products`

### TypeScript errors
- Run: `npm run build` to check for type errors
- Types should match between backend response and frontend expectations

## Features

### ✅ Working
- Product listings
- Product detail pages
- Collections
- Search
- Filters & sorting
- Pagination

### ⏳ TODO
- Cart (using Shopify for now)
- Checkout
- User authentication integration
- Admin dashboard

## Notes

- Cart functionality still uses Shopify API
- Image uploads need backend implementation
- Review system needs backend APIs
