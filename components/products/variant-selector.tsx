'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { CartProduct, Product, ProductOption, ProductVariant, SelectedOptions } from '@/lib/shopify/types';
import { startTransition, useMemo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { useParams, useSearchParams } from 'next/navigation';
import { ColorSwatch } from '@/components/ui/color-picker';
import { Button } from '@/components/ui/button';
import { getColorHex } from '@/lib/utils';
import { getShopifyProductId } from '@/lib/shopify/utils';

type Combination = {
  id: string;
  availableForSale: boolean;
  inventoryQuantity?: number;
  inventoryPolicy?: string;
  [key: string]: string | boolean | number | undefined;
};

const variantOptionSelectorVariants = cva('flex items-start gap-4', {
  variants: {
    variant: {
      card: 'rounded-md bg-popover py-2 px-3 justify-between',
      condensed: 'justify-start',
    },
  },
  defaultVariants: {
    variant: 'card',
  },
});

interface VariantOptionSelectorComponentProps extends VariantProps<typeof variantOptionSelectorVariants> {
  option: ProductOption;
  product: Product;
  selectedValue: string;
  selectedOptions: Record<string, string>;
  isTargetingProduct: boolean;
  onSelect?: (valueName: string) => void;
}

export function VariantOptionSelectorComponent({
  option,
  variant,
  product,
  selectedValue,
  selectedOptions,
  isTargetingProduct,
  onSelect,
}: VariantOptionSelectorComponentProps) {
  const { variants, options } = product;
  const optionNameLowerCase = option.name.toLowerCase();

  const combinations: Combination[] = Array.isArray(variants)
    ? variants.map(variant => {
        // KIỂM TRA TÍNH KHẢ DỤNG CỦA VARIANT
        // =====================================
        
        // Bước 1: Kiểm tra flags availability ở level product và variant
        const productAvailable = product.availableForSale !== false; // Default true nếu không set
        const variantAvailable = variant.availableForSale !== false; // Default true nếu không set
        
        if (!productAvailable || !variantAvailable) {
          // Nếu product hoặc variant bị tắt → không bán
          return {
            id: variant.id,
            availableForSale: false,
            inventoryQuantity: variant.inventoryQuantity,
            inventoryPolicy: variant.inventoryPolicy,
            ...variant.selectedOptions.reduce(
              (accumulator, option) => ({
                ...accumulator,
                [option.name.toLowerCase()]: option.value,
              }),
              {}
            ),
          };
        }
        
        // Bước 2: Kiểm tra inventory availability (5 RULES)
const { inventoryPolicy, inventoryQuantity } = variant;
let inventoryAvailable = true;

// RULE 1: CONTINUE policy = cho phép overselling, luôn available
if (inventoryPolicy === 'CONTINUE') {
  inventoryAvailable = true;
}
// RULE 2: DENY policy nhưng KHÔNG có dữ liệu inventory = UNSAFE, phải disable
else if (inventoryPolicy === 'DENY' && inventoryQuantity == null) {
  inventoryAvailable = false;
}
// RULE 3: DENY policy + có số liệu inventory = kiểm tra stock
else if (inventoryPolicy === 'DENY') {
  inventoryAvailable = (inventoryQuantity ?? 0) > 0;
}
// RULE 4: Không có policy (undefined/null) = legacy inventory
else if (inventoryPolicy == null) {
  // Default to available nếu không track, ngược lại check stock
  inventoryAvailable = (inventoryQuantity ?? 1) > 0;
}
// RULE 5: Policy khác (unknown) = fallback an toàn
else {
  // Unknown policy -> assume available nếu không có data
  inventoryAvailable = inventoryQuantity == null ? true : (inventoryQuantity ?? 0) > 0;
}
        
        return {
          id: variant.id,
          availableForSale: inventoryAvailable,
          inventoryQuantity: variant.inventoryQuantity,
          inventoryPolicy: variant.inventoryPolicy,
          ...variant.selectedOptions.reduce(
            (accumulator, option) => ({
              ...accumulator,
              [option.name.toLowerCase()]: option.value,
            }),
            {}
          ),
        };
      })
    : [];

  const isColorOption = optionNameLowerCase === 'color';

  return (
    <dl className={variantOptionSelectorVariants({ variant })}>
      <dt className="text-base font-semibold leading-8">{option.name}</dt>
      <dd className="flex flex-wrap gap-2">
        {option.values.map(value => {
          const currentState = selectedOptions;
          const optionParams = {
            ...currentState,
            [optionNameLowerCase]: value.name, // Use value.name, not value.id
          };

          const filtered = Object.entries(optionParams).filter(([key, value]) =>
            options.find(option => option.name.toLowerCase() === key && option.values.some(val => val.name === value))
          );
          const matchedVariant = combinations.find(combination =>
            filtered.every(([key, value]) => combination[key] === value)
          );
          const isAvailableForSale = matchedVariant?.availableForSale;
          
          // Build tooltip message
          let tooltipMessage = `${option.name} ${value.name}`;
          if (!isAvailableForSale && matchedVariant) {
            if (matchedVariant.inventoryQuantity != null && matchedVariant.inventoryQuantity <= 0) {
              tooltipMessage += ' (Hết hàng)';
            } else {
              tooltipMessage += ' (Không khả dụng)';
            }
          } else if (matchedVariant && matchedVariant.inventoryQuantity != null && matchedVariant.inventoryQuantity > 0 && matchedVariant.inventoryQuantity <= 5) {
            tooltipMessage += ` (Còn ${matchedVariant.inventoryQuantity} sản phẩm)`;
          }

          const isActive = isTargetingProduct && selectedValue === value.name;

          if (isColorOption) {
            const color = getColorHex(value.name);
            const name = value.name.split('/');

            return (
              <div key={value.id} className={`relative ${!isAvailableForSale ? 'opacity-40 cursor-not-allowed' : ''}`}>
                <ColorSwatch
                  color={
                    Array.isArray(color)
                      ? [
                          { name: name[0], value: color[0] },
                          { name: name[1], value: color[1] },
                        ]
                      : { name: name[0], value: color }
                  }
                  isSelected={isActive}
                  onColorChange={() => isAvailableForSale && onSelect?.(value.name)}
                  size={variant === 'condensed' ? 'sm' : 'md'}
                  atLeastOneColorSelected={!!selectedValue}
                />
                {!isAvailableForSale && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 24 24">
                      <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" className="text-destructive" />
                    </svg>
                  </div>
                )}
              </div>
            );
          }

          return (
            <Button
              onClick={() => onSelect?.(value.name)}
              key={value.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              disabled={!isAvailableForSale}
              title={tooltipMessage}
              className={`min-w-[40px] relative ${
                !isAvailableForSale ? 'opacity-50' : 
                matchedVariant && matchedVariant.inventoryQuantity != null && matchedVariant.inventoryQuantity > 0 && matchedVariant.inventoryQuantity <= 5 ? 'ring-1 ring-orange-400' : ''
              }`}
            >
              <span className={!isAvailableForSale ? 'line-through' : ''}>
                {value.name}
              </span>
              {!isAvailableForSale && (
                <span className="absolute -top-1 -right-1 text-xs text-destructive font-bold">✕</span>
              )}
              {isAvailableForSale && matchedVariant && matchedVariant.inventoryQuantity != null && matchedVariant.inventoryQuantity > 0 && matchedVariant.inventoryQuantity <= 5 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-orange-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {matchedVariant.inventoryQuantity}
                </span>
              )}
            </Button>
          );
        })}
      </dd>
    </dl>
  );
}

interface VariantOptionSelectorProps extends VariantProps<typeof variantOptionSelectorVariants> {
  option: ProductOption;
  product: Product;
}

export function VariantOptionSelector({ option, variant, product }: VariantOptionSelectorProps) {
  const pathname = useParams<{ handle?: string }>();
  const optionNameLowerCase = option.name.toLowerCase();

  const [selectedValue, setSelectedValue] = useQueryState(optionNameLowerCase, parseAsString.withDefault(''));
  const [activeProductId, setActiveProductId] = useQueryState('pid', parseAsString.withDefault(''));

  const selectedOptions = useSelectedOptions(product);

  const isProductPage = pathname.handle === product.handle;
  const isTargetingProduct = isProductPage || activeProductId === getShopifyProductId(product.id);

  const handleSelect = (valueName: string) => {
    startTransition(() => {
      setSelectedValue(valueName);
      if (!isProductPage) {
        setActiveProductId(getShopifyProductId(product.id));
      }
    });
  };

  return (
    <VariantOptionSelectorComponent
      option={option}
      variant={variant}
      product={product}
      selectedValue={selectedValue}
      selectedOptions={selectedOptions}
      isTargetingProduct={isTargetingProduct}
      onSelect={handleSelect}
    />
  );
}

interface VariantSelectorProps extends VariantProps<typeof variantOptionSelectorVariants> {
  options: ProductOption[];
  variants: ProductVariant[];
  product: Product;
}

export function VariantSelector({ options, variants, product, variant }: VariantSelectorProps) {
  if (!options.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <VariantOptionSelector
          key={option.id}
          option={option}
          product={product}
          variant={variant}
        />
      ))}
    </div>
  );
}

export const useSelectedOptions = (product: Product): Record<string, string> => {
  const { options } = product;
  const searchParams = useSearchParams();

  const selectedOptions = useMemo(() => {
    const state: Record<string, string> = {};
    options.forEach(option => {
      const key = option.name.toLowerCase();
      const value = searchParams.get(key);
      if (value) state[key] = value;
    });
    return state;
  }, [options, searchParams]);

  return selectedOptions;
};

export const useSelectedVariant = (product: Product) => {
  const selectedOptions = useSelectedOptions(product);

  const selectedVariant = useMemo(() => {
    const { variants } = product;
    return Array.isArray(variants)
      ? variants.find((variant: ProductVariant) =>
          variant.selectedOptions.every(option => option.value === selectedOptions[option.name.toLowerCase()])
        )
      : undefined;
  }, [product, selectedOptions]);

  return selectedVariant;
};

export const useProductImages = (product: Product | CartProduct, selectedOptions?: SelectedOptions) => {
  const images = useMemo(() => {
    return Array.isArray(product.images) ? product.images : [];
  }, [product.images]);

  const optionsObject = useMemo(() => {
    return selectedOptions?.reduce(
      (acc, option) => {
        acc[option.name.toLowerCase()] = option.value.toLowerCase();
        return acc;
      },
      {} as Record<string, string>
    );
  }, [selectedOptions]);

  // Try to match images by alt text with selected variant values
  // This enables Shopify products to show different images when variants are selected
  // by matching the image alt text with variant names (e.g., "Red Shirt" shows when Red is selected)
  const variantImagesByAlt = useMemo(() => {
    if (!optionsObject || Object.keys(optionsObject).length === 0) return [];

    const selectedValues = Object.values(optionsObject);

    return images.filter(image => {
      if (!image.altText) return false;

      const altTextLower = image.altText.toLowerCase();

      // Check if any selected variant value is mentioned in the alt text
      return selectedValues.some(value => altTextLower.includes(value.toLowerCase()));
    });
  }, [optionsObject, images]);

  // Original logic for images with selectedOptions metadata
  const variantImages = useMemo(() => {
    if (!optionsObject) return [];

    return images.filter(image => {
      return Object.entries(optionsObject || {}).every(([key, value]) =>
        image.selectedOptions?.some(option => option.name === key && option.value === value)
      );
    });
  }, [optionsObject, images]);

  const defaultImages = images.filter(image => !image.selectedOptions);
  const featuredImage = product.featuredImage;

  // Prioritize images with selectedOptions metadata first
  if (variantImages.length > 0) {
    return variantImages;
  }

  // Then try images matched by alt text (for Shopify products with 2+ variants)
  if (variantImagesByAlt.length > 0) {
    return variantImagesByAlt;
  }

  // Fall back to default images
  if (defaultImages.length > 0) {
    return defaultImages;
  }

  // Final fallback to featured image
  if (featuredImage) {
    return [featuredImage];
  }

  // Ultimate fallback - return first image or empty array
  return images.length > 0 ? [images[0]] : [];
};
