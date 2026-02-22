'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';

interface ProductDetails {
  id: string;
  slug: string;
  variants?: Array<{
    id: string;
    sku: string;
    price: number;
    stock: number;
    available: boolean;
  }>;
}

interface UseAddToCartProps {
  productId: string;
  productSlug: string;
  inStock: boolean;
}

/**
 * Hook for adding products to cart
 * @param props - Product information
 * @returns Object with loading state and addToCart function
 */
export function useAddToCart({ productId, productSlug, inStock }: UseAddToCartProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const addToCart = async () => {
    if (!inStock) {
      return;
    }

    // Validate product slug before making API call
    if (!productSlug || productSlug.trim() === '' || productSlug.includes(' ')) {
      console.error('❌ [PRODUCT CARD] Invalid product slug:', productSlug);
      alert(t('common.alerts.invalidProduct'));
      return;
    }

    // If user is not logged in, use localStorage for cart
    if (!isLoggedIn) {
      setIsAddingToCart(true);
      try {
        const CART_KEY = 'shop_cart_guest';
        const stored = localStorage.getItem(CART_KEY);
        const cart: Array<{ productId: string; productSlug: string; variantId?: string; quantity: number }> = stored ? JSON.parse(stored) : [];
        
        // Get product details to get variant ID
        const encodedSlug = encodeURIComponent(productSlug.trim());
        const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);
        
        if (!productDetails.variants || productDetails.variants.length === 0) {
          alert(t('common.alerts.noVariantsAvailable'));
          setIsAddingToCart(false);
          return;
        }

        const variantId = productDetails.variants[0].id;
        const variant = productDetails.variants[0];
        
        // Check if product is already in cart
        const existingItem = cart.find(item => item.productId === productId && item.variantId === variantId);
        
        // Calculate total quantity that will be in cart after adding
        const currentQuantityInCart = existingItem?.quantity || 0;
        const totalQuantity = currentQuantityInCart + 1;
        
        // Check if total quantity exceeds available stock
        if (totalQuantity > variant.stock) {
          console.log('🚫 [PRODUCT CARD - GUEST CART] Stock limit exceeded:', {
            variantId,
            currentInCart: currentQuantityInCart,
            requestedQuantity: 1,
            totalQuantity,
            availableStock: variant.stock
          });
          alert(t('common.alerts.noMoreStockAvailable'));
          setIsAddingToCart(false);
          return;
        }
        
        if (existingItem) {
          existingItem.quantity = totalQuantity;
          // Update slug if it wasn't there
          if (!existingItem.productSlug) {
            existingItem.productSlug = productDetails.slug;
          }
        } else {
          cart.push({
            productId: productId,
            productSlug: productDetails.slug || productSlug,
            variantId: variantId,
            quantity: 1,
          });
        }
        
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new Event('cart-updated'));
      } catch (error: unknown) {
        console.error('❌ [PRODUCT CARD] Error adding to guest cart:', error);
        
        // Check if error is about product not found
        const err = error as { message?: string; status?: number };
        if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404) {
          alert(t('common.alerts.productNotFound'));
        } else {
          // If failed to add to localStorage, redirect to login
          router.push(`/login?redirect=/products`);
        }
      } finally {
        setIsAddingToCart(false);
      }
      return;
    }

    setIsAddingToCart(true);

    try {
      // Get product details to get variant ID
      const encodedSlug = encodeURIComponent(productSlug.trim());
      const productDetails = await apiClient.get<ProductDetails>(`/api/v1/products/${encodedSlug}`);

      if (!productDetails.variants || productDetails.variants.length === 0) {
        alert(t('common.alerts.noVariantsAvailable'));
        return;
      }

      const variantId = productDetails.variants[0].id;
      
      await apiClient.post(
        '/api/v1/cart/items',
        {
          productId: productId,
          variantId: variantId,
          quantity: 1,
        }
      );

      // Trigger cart update
      window.dispatchEvent(new Event('cart-updated'));
    } catch (error: unknown) {
      console.error('❌ [PRODUCT CARD] Error adding to cart:', error);
      
      const err = error as { 
        message?: string; 
        status?: number; 
        statusCode?: number;
        response?: {
          data?: {
            detail?: string;
            title?: string;
          };
        };
      };
      
      // Check if error is about product not found
      if (err?.message?.includes('does not exist') || err?.message?.includes('404') || err?.status === 404 || err?.statusCode === 404) {
        alert(t('common.alerts.productNotFound'));
        setIsAddingToCart(false);
        return;
      }
      
      // Check if error is about insufficient stock
      if (err.response?.data?.detail?.includes('No more stock available') || 
          err.response?.data?.detail?.includes('exceeds available stock') ||
          err.response?.data?.title === 'Insufficient stock') {
        alert(t('common.alerts.noMoreStockAvailable'));
        setIsAddingToCart(false);
        return;
      }
      
      // If authorization error, redirect to login
      if (err.message?.includes('401') || err.message?.includes('Unauthorized') || err?.status === 401 || err?.statusCode === 401) {
        router.push(`/login?redirect=/products`);
      } else {
        // Generic error message
        alert(t('common.alerts.failedToAddToCart'));
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  return { isAddingToCart, addToCart };
}




