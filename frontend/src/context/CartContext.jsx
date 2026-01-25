import React, { createContext, useState, useCallback, useEffect, useContext, useRef } from 'react';
import { cartApi } from '../services/cart';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);
  const isFirstRender = useRef(true);

  // Helper: Calculate Totals for Guest Cart
  const calculateTotals = (items) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return { 
      items, 
      totalAmount, 
      totalItems,
      subtotal: totalAmount,
      totalTax: 0,
      totalShipping: 0
    };
  };

  // Sync Guest Cart to Server after Login
  const syncGuestCart = async () => {
    const saved = localStorage.getItem('guestCart');
    if (!saved) return;

    try {
      const guestData = JSON.parse(saved);
      if (guestData.items?.length > 0) {
        // Loop through guest items and add to user database
        for (const item of guestData.items) {
          const payload = {
            product: item.product._id,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor
          };
          await cartApi.addToCart(payload, item.quantity);
        }
        localStorage.removeItem('guestCart');
      }
    } catch (error) {
      console.error('Failed to sync guest cart:', error);
    }
  };

  // Fetch Cart
  const fetchCart = useCallback(async () => {
    setLoading(true);
    if (user) {
      try {
        // If they just logged in, sync their guest items first
        if (localStorage.getItem('guestCart')) {
          await syncGuestCart();
        }
        const data = await cartApi.getCart();
        setCart(data.cart || { items: [], totalAmount: 0, totalItems: 0 });
      } catch (error) {
        console.error('Failed to fetch user cart', error);
      }
    } else {
      // Load from LocalStorage for guests
      const saved = localStorage.getItem('guestCart');
      if (saved) {
        setCart(JSON.parse(saved));
      } else {
        setCart({ items: [], totalAmount: 0, totalItems: 0 });
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Persist Guest Cart to LocalStorage
  useEffect(() => {
    if (!user && !isFirstRender.current) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    isFirstRender.current = false;
  }, [cart, user]);

  // Add to Cart
  const addToCart = useCallback(async (productData, quantity = 1) => {
    const productId = productData.product || productData._id;
    const size = productData.selectedSize || productData.sizes?.[0] || 'Free Size';
    const color = productData.selectedColor || productData.colors?.[0] || 'Standard';

    const isReseller = user?.role === 'reseller';
    const priceToUse = (isReseller && productData.wholesalePrice > 0) 
      ? Number(productData.wholesalePrice) 
      : Number(productData.price);

    if (user) {
      try {
        const payload = {
          product: productId,
          quantity,
          selectedSize: size,
          selectedColor: color
        };
        const data = await cartApi.addToCart(payload, quantity);
        setCart(data.cart);
        toast.success(isReseller ? 'Added to wholesale order' : 'Added to cart');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add item');
      }
    } else {
      // Guest logic: Update Local State
      setCart(prev => {
        const existingItemIndex = prev.items.findIndex(item => 
          item.product._id === productId && 
          item.selectedColor === color &&
          item.selectedSize === size
        );

        let newItems = [...prev.items];
        
        if (existingItemIndex > -1) {
          newItems[existingItemIndex].quantity += quantity;
        } else {
          newItems.push({
            _id: Date.now().toString(), // Temp ID for React keys
            product: { 
              ...productData, 
              _id: productId 
            },
            quantity,
            price: priceToUse,
            selectedSize: size,
            selectedColor: color,
            shippingAmount: 0,
            taxAmount: 0
          });
        }
        return calculateTotals(newItems);
      });
      toast.success('Added to bag');
    }
  }, [user]);

  // Update Quantity
  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) return;

    if (user) {
      try {
        const data = await cartApi.updateCartItem(cartItemId, quantity);
        setCart(data.cart);
      } catch (error) {
        toast.error('Failed to update quantity');
      }
    } else {
      setCart(prev => {
        const newItems = prev.items.map(item => 
          item._id === cartItemId ? { ...item, quantity } : item
        );
        return calculateTotals(newItems);
      });
    }
  }, [user]);

  // Remove Item
  const removeFromCart = useCallback(async (cartItemId) => {
    if (user) {
      try {
        const data = await cartApi.removeFromCart(cartItemId);
        setCart(data.cart);
        toast.success('Item removed');
      } catch (error) {
        toast.error('Failed to remove item');
      }
    } else {
      setCart(prev => {
        const newItems = prev.items.filter(item => item._id !== cartItemId);
        return calculateTotals(newItems);
      });
      toast.success('Item removed');
    }
  }, [user]);

  // Clear Cart
  const clearCart = useCallback(async () => {
    if (user) {
      try {
        await cartApi.clearCart();
        setCart({ items: [], totalAmount: 0, totalItems: 0 });
      } catch (error) {
        console.error(error);
      }
    } else {
      setCart({ items: [], totalAmount: 0, totalItems: 0 });
      localStorage.removeItem('guestCart');
    }
  }, [user]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCart, 
    itemCount: cart?.totalItems || 0,
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};