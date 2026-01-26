// Backend API integration - Replace Shopify with our own backend
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { TAGS } from '@/lib/constants';
import backendAPI from './backend-api';
import type {
  Product,
  Collection,
  Cart,
  ProductOption,
  ProductVariant,
  Money,
  ProductCollectionSortKey,
  ProductSortKey,
  Image,
  SEO,
} from './types';

// Map sort keys from frontend to backend format
function mapSortKey(sortKey?: ProductSortKey | ProductCollectionSortKey): string {
  const sortMap: Record<string, string> = {
    'RELEVANCE': 'CREATED_DESC',
    'BEST_SELLING': 'CREATED_DESC', // TODO: implement best selling
    'CREATED_AT': 'CREATED_DESC',
    'CREATED': 'CREATED_DESC',
    'ID': 'CREATED_DESC',
    'PRICE': 'PRICE_ASC',
    'PRODUCT_TYPE': 'TITLE_ASC',
    'TITLE': 'TITLE_ASC',
    'UPDATED_AT': 'UPDATED_DESC',
    'VENDOR': 'TITLE_ASC',
    'COLLECTION_DEFAULT': 'CREATED_DESC',
    'MANUAL': 'CREATED_DESC',
  };
  
  return sortMap[sortKey || 'CREATED_AT'] || 'CREATED_DESC';
}

// Transform backend product to frontend Product type
function transformBackendProduct(backendProduct: any): Product {
  const featuredImage: Image = backendProduct.featuredImage || {
    url: backendProduct.images?.[0]?.url || '',
    altText: backendProduct.images?.[0]?.altText || backendProduct.title,
    width: backendProduct.images?.[0]?.width || 800,
    height: backendProduct.images?.[0]?.height || 800,
    thumbhash: backendProduct.images?.[0]?.blurhash || backendProduct.images?.[0]?.thumbhash,
  };

  const images: Image[] = (backendProduct.images || []).map((img: any) => ({
    url: img.url,
    altText: img.altText || backendProduct.title,
    width: img.width || 800,
    height: img.height || 800,
    thumbhash: img.blurhash || img.thumbhash,
  }));

  const options: ProductOption[] = (backendProduct.options || []).map((opt: any) => ({
    id: opt.id,
    name: opt.name,
    values: (opt.values || []).map((val: any) => ({
      id: val.id || val.name?.toLowerCase().replace(/\s+/g, '-'),
      name: val.name,
    })),
  }));

  const variants: ProductVariant[] = (backendProduct.variants || []).map((variant: any) => ({
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    inventoryQuantity: variant.inventoryQuantity,
    inventoryPolicy: variant.inventoryPolicy as 'DENY' | 'CONTINUE' | undefined,
    price: {
      amount: String(variant.price?.amount || variant.price || '0'),
      currencyCode: variant.price?.currencyCode || backendProduct.currencyCode || 'USD',
    },
    selectedOptions: variant.selectedOptions || [],
  }));

  const seo: SEO = {
    title: backendProduct.seo?.title || backendProduct.seoTitle || backendProduct.title,
    description: backendProduct.seo?.description || backendProduct.seoDescription || backendProduct.description,
  };

  return {
    id: backendProduct.id,
    title: backendProduct.title,
    handle: backendProduct.handle,
    categoryId: backendProduct.categoryId || backendProduct.category?.id,
    description: backendProduct.description || '',
    descriptionHtml: backendProduct.descriptionHtml || `<p>${backendProduct.description || ''}</p>`,
    featuredImage,
    currencyCode: backendProduct.currencyCode || 'USD',
    priceRange: {
      minVariantPrice: backendProduct.priceRange?.minVariantPrice || {
        amount: variants[0]?.price.amount || '0',
        currencyCode: backendProduct.currencyCode || 'USD',
      },
      maxVariantPrice: backendProduct.priceRange?.maxVariantPrice || {
        amount: variants[0]?.price.amount || '0',
        currencyCode: backendProduct.currencyCode || 'USD',
      },
    },
    compareAtPrice: backendProduct.compareAtPrice,
    seo,
    options,
    tags: backendProduct.tags || [],
    variants,
    images,
    availableForSale: backendProduct.availableForSale !== false,
  };
}

// Transform backend collection to frontend Collection type
function transformBackendCollection(backendCollection: any): Collection {
  return {
    handle: backendCollection.handle,
    title: backendCollection.title,
    description: backendCollection.description || '',
    seo: {
      title: backendCollection.seo?.title || backendCollection.title,
      description: backendCollection.seo?.description || backendCollection.description || '',
    },
    parentCategoryTree: [],
    updatedAt: backendCollection.updatedAt || new Date().toISOString(),
    path: backendCollection.path || `/shop/${backendCollection.handle}`,
  };
}

// Public API functions using backend
export async function getCollections(): Promise<Collection[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('seconds');

  try {
    const response = await backendAPI.getCollections({ isVisible: true });
    return (response.data || []).map(transformBackendCollection);
  } catch (error) {
    console.error('Error fetching collections from backend:', error);
    return [];
  }
}

export async function getCollection(handle: string): Promise<Collection | null> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('seconds');

  try {
    const collection = await backendAPI.getCollection(handle);
    return collection ? transformBackendCollection(collection) : null;
  } catch (error) {
    console.error('Error fetching collection from backend:', error);
    return null;
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('seconds');

  try {
    const product = await backendAPI.getProduct(handle);
    return product ? transformBackendProduct(product) : null;
  } catch (error) {
    console.error('Error fetching product from backend:', error);
    return null;
  }
}

export async function getProducts(params: {
  limit?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('seconds');

  try {
    const sort = mapSortKey(params.sortKey);
    const response = await backendAPI.getProducts({
      limit: params.limit || 20,
      sort: params.reverse ? sort.replace('ASC', 'DESC').replace('DESC', 'ASC') : sort,
      q: params.query,
    });
    
    return (response.data || []).map(transformBackendProduct);
  } catch (error) {
    console.error('Error fetching products from backend:', error);
    return [];
  }
}

export async function getCollectionProducts(params: {
  collection: string;
  limit?: number;
  sortKey?: ProductCollectionSortKey;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.collectionProducts);
  cacheLife('seconds');

  try {
    const sort = mapSortKey(params.sortKey);
    const response = await backendAPI.getCollectionProducts(params.collection, {
      limit: params.limit || 20,
      sort: params.reverse ? sort.replace('ASC', 'DESC').replace('DESC', 'ASC') : sort,
    });
    
    return (response.data || []).map(transformBackendProduct);
  } catch (error) {
    console.error('Error fetching collection products from backend:', error);
    return [];
  }
}

// Cart functions - Keep using Shopify for now (or implement backend cart later)
// Transform backend cart to frontend Cart type
function transformBackendCart(backendCart: any): Cart {
  return {
    id: backendCart.id,
    checkoutUrl: `/checkout/${backendCart.id}`, // TODO: implement checkout
    cost: {
      subtotalAmount: {
        amount: backendCart.totalPrice?.toString() || '0',
        currencyCode: 'USD',
      },
      totalAmount: {
        amount: backendCart.totalPrice?.toString() || '0',
        currencyCode: 'USD',
      },
      totalTaxAmount: {
        amount: '0',
        currencyCode: 'USD',
      },
    },
    lines: (backendCart.items || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      cost: {
        totalAmount: {
          amount: (item.price * item.quantity).toString(),
          currencyCode: 'USD',
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
        },
        price: {
          amount: item.price.toString(),
          currencyCode: 'USD',
        },
      },
    })),
    totalQuantity: backendCart.totalItems || 0,
  };
}

export async function getCart(): Promise<Cart | null> {
  try {
    const { getCart: getCartAction } = await import('@/components/cart/actions');
    return await getCartAction();
  } catch (error) {
    console.error('Error fetching cart:', error);
    return null;
  }
}

// Cart mutation functions using backend API
export async function createCart() {
  const sessionId = Math.random().toString(36).substring(7);
  const response = await backendAPI.createCart(sessionId);
  return transformBackendCart(response.data);
}

export async function addCartLines(cartId: string, lines: Array<{
  merchandiseId: string;
  quantity: number;
}>) {
  // Convert merchandiseId to productId/variantId
  const items = lines.map(line => ({
    productId: line.merchandiseId, // May need to parse this
    variantId: line.merchandiseId.includes('Variant') ? line.merchandiseId : undefined,
    quantity: line.quantity,
  }));

  let cart;
  for (const item of items) {
    const response = await backendAPI.addToCart(cartId, item);
    cart = response.data;
  }

  return transformBackendCart(cart);
}

export async function updateCartLines(cartId: string, lines: Array<{
  id: string;
  quantity: number;
}>) {
  let cart;
  for (const line of lines) {
    const response = await backendAPI.updateCartItem(cartId, line.id, line.quantity);
    cart = response.data;
  }

  return transformBackendCart(cart);
}

export async function removeCartLines(cartId: string, lineIds: string[]) {
  let cart;
  for (const lineId of lineIds) {
    const response = await backendAPI.removeFromCart(cartId, lineId);
    cart = response.data;
  }

  return transformBackendCart(cart);
}
