// LUMI Web - Shopify Implementation
// Wraps Shopify API with unified interface

import {
  getProducts as getShopifyProducts,
  getProduct as getShopifyProduct,
  getCollections as getShopifyCollections,
  getCollectionProducts as getShopifyCollectionProducts,
  createCart,
  addCartLines,
  updateCartLines,
  removeCartLines,
} from './shopify';

import type {
  Product,
  Collection,
  Cart,
  Money,
  ProductOption,
  ProductVariant,
  ProductSortKey,
  ProductCollectionSortKey,
  ShopifyCollection,
  ShopifyProduct,
} from './types';

import { thumbhashToDataURL } from './utils';

// Utility function to extract the first sentence from a description
function getFirstSentence(text: string): string {
  if (!text) return '';

  const cleaned = text.trim();
  const match = cleaned.match(/^[^.!?]*[.!?]/);

  if (match) {
    return match[0].trim();
  }

  if (cleaned.length > 100) {
    return cleaned.substring(0, 100).trim() + '...';
  }

  return cleaned;
}

// Helper functions for data transformation

function transformShopifyMoney(shopifyMoney: { amount: string; currencyCode: string } | undefined): Money {
  return {
    amount: shopifyMoney?.amount || '0',
    currencyCode: shopifyMoney?.currencyCode || 'USD',
  };
}

function transformShopifyOptions(
  shopifyOptions: Array<{ id?: string; name: string; values: string[] }>
): ProductOption[] {
  return shopifyOptions.map(option => ({
    id: option.id || option.name.toLowerCase().replace(/\s+/g, '-'),
    name: option.name,
    values: option.values.map(value => ({
      id: value.toLowerCase().replace(/\s+/g, '-'),
      name: value,
    })),
  }));
}

function transformShopifyVariants(shopifyVariants: { edges: Array<{ node: any }> } | undefined): ProductVariant[] {
  if (!Array.isArray(shopifyVariants?.edges)) return [];

  return shopifyVariants.edges.map(edge => ({
    id: edge.node.id,
    title: edge.node.title || '',
    availableForSale: edge.node.availableForSale !== false,
    price: transformShopifyMoney(edge.node.price),
    selectedOptions: edge.node.selectedOptions || [],
  }));
}

// Adapter functions
function adaptShopifyCollection(shopifyCollection: ShopifyCollection): Collection {
  return {
    ...shopifyCollection,
    seo: {
      title: shopifyCollection.title,
      description: shopifyCollection.description || '',
    },
    parentCategoryTree: [],
    updatedAt: new Date().toISOString(),
    path: `/shop/${shopifyCollection.handle}`,
  };
}

function adaptShopifyProduct(shopifyProduct: ShopifyProduct): Product {
  const firstImage = shopifyProduct.images?.edges?.[0]?.node;
  const description = getFirstSentence(shopifyProduct.description || '');

  return {
    ...shopifyProduct,
    description,
    categoryId: shopifyProduct.productType || shopifyProduct.category?.name,
    tags: [],
    availableForSale: true,
    currencyCode: shopifyProduct.priceRange?.minVariantPrice?.currencyCode || 'USD',
    featuredImage: firstImage
      ? {
          ...firstImage,
          altText: firstImage.altText || shopifyProduct.title || '',
          height: 600,
          width: 600,
          thumbhash: firstImage.thumbhash ? thumbhashToDataURL(firstImage.thumbhash) : undefined,
        }
      : { url: '', altText: '', height: 0, width: 0 },
    seo: {
      title: shopifyProduct.title || '',
      description,
    },
    priceRange: {
      minVariantPrice: transformShopifyMoney(shopifyProduct.priceRange?.minVariantPrice),
      maxVariantPrice: transformShopifyMoney(shopifyProduct.priceRange?.minVariantPrice),
    },
    compareAtPrice:
      shopifyProduct.compareAtPriceRange?.minVariantPrice &&
      parseFloat(shopifyProduct.compareAtPriceRange.minVariantPrice.amount) >
        parseFloat(shopifyProduct.priceRange?.minVariantPrice?.amount || '0')
        ? transformShopifyMoney(shopifyProduct.compareAtPriceRange.minVariantPrice)
        : undefined,
    images:
      shopifyProduct.images?.edges?.map(edge => ({
        ...edge.node,
        altText: edge.node.altText || shopifyProduct.title || '',
        height: 600,
        width: 600,
        thumbhash: edge.node.thumbhash ? thumbhashToDataURL(edge.node.thumbhash) : undefined,
      })) || [],
    options: transformShopifyOptions(shopifyProduct.options || []),
    variants: transformShopifyVariants(shopifyProduct.variants),
  };
}

// Public API functions
export async function getCollections(): Promise<Collection[]> {

  try {
    const shopifyCollections = await getShopifyCollections();
    return shopifyCollections.map(adaptShopifyCollection);
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export async function getCollection(handle: string): Promise<Collection | null> {

  try {
    const collections = await getShopifyCollections();
    const collection = collections.find(collection => collection.handle === handle);
    return collection ? adaptShopifyCollection(collection) : null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export async function getProduct(handle: string): Promise<Product | null> {

  try {
    const shopifyProduct = await getShopifyProduct(handle);
    return shopifyProduct ? adaptShopifyProduct(shopifyProduct) : null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function getProducts(params: {
  limit?: number;
  sortKey?: ProductSortKey;
  reverse?: boolean;
  query?: string;
}): Promise<Product[]> {

  try {
    const shopifyProducts = await getShopifyProducts({
      first: params.limit,
      sortKey: params.sortKey,
      reverse: params.reverse,
      query: params.query,
    });
    return shopifyProducts.map(adaptShopifyProduct);
  } catch (error) {
    console.error('Error fetching products:', error);
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
  try {
    const shopifyProducts = await getShopifyCollectionProducts({
      collection: params.collection,
      limit: params.limit,
      sortKey: params.sortKey,
      reverse: params.reverse,
      query: params.query,
    });
    return shopifyProducts.map(adaptShopifyProduct);
  } catch (error) {
    console.error('Error fetching collection products:', error);
    return [];
  }
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

// Re-export cart mutation functions
export { createCart, addCartLines, updateCartLines, removeCartLines };
