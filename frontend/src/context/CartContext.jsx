import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { cartApi } from '../services/cart';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // State
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);

  // --- Helper: Calculate Totals (For Guest/Optimistic updates) ---
  const calculateTotals = (items) => {
    // Basic frontend calculation - actual tax/shipping will be updated by backend
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    
    return { 
      items, 
      totalAmount, 
      totalItems,
      subtotal: totalAmount,
      totalTax: 0, // Frontend doesn't know tax rules, waits for backend
      totalShipping: 0 // Frontend doesn't know shipping rules, waits for backend
    };
  };

  // --- 1. Fetch Cart ---
  const fetchCart = useCallback(async () => {
    if (user) {
      // LOGGED IN: Fetch from API
      try {
        setLoading(true);
        const data = await cartApi.getCart();
        setCart(data.cart || { items: [], totalAmount: 0, totalItems: 0 });
      } catch (error) {
        console.error('Failed to fetch cart', error);
      } finally {
        setLoading(false);
      }
    } else {
      // GUEST: Fetch from LocalStorage
      const saved = localStorage.getItem('guestCart');
      if (saved) {
        setCart(JSON.parse(saved));
      } else {
        setCart({ items: [], totalAmount: 0, totalItems: 0 });
      }
    }
  }, [user]);

  // Sync on mount or user change
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Persist Guest Cart
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // --- 2. Add to Cart ---
  const addToCart = useCallback(async (product, quantity = 1, selectedSize = null, selectedColor = null) => {
    // Determine selections
    const size = selectedSize || product.selectedSize || product.sizes?.[0] || 'Free Size';
    const color = selectedColor || product.selectedColor || product.colors?.[0] || 'Standard';

    // ✅ FIX: Determine correct price based on User Role for Optimistic Update
    const isReseller = user?.role === 'reseller';
    const priceToUse = (isReseller && product.wholesalePrice > 0) 
      ? Number(product.wholesalePrice) 
      : Number(product.price);

    // Payload for Backend
    const itemPayload = {
      product: product._id, // Key must be 'product'
      quantity,
      selectedSize: size,
      selectedColor: color
    };

    if (user) {
      // >> LOGGED IN: API Call
      try {
        const data = await cartApi.addToCart(itemPayload);
        setCart(data.cart);
        toast.success(isReseller ? 'Added to wholesale order' : 'Added to cart');
      } catch (error) {
        console.error(error);
        toast.error('Failed to add item');
      }
    } else {
      // >> GUEST: Local State
      setCart(prev => {
        const existingItemIndex = prev.items.findIndex(item => 
          item.product._id === product._id && 
          item.selectedColor === color &&
          item.selectedSize === size
        );

        let newItems = [...prev.items];
        
        if (existingItemIndex > -1) {
          newItems[existingItemIndex].quantity += quantity;
          // Update price in case it changed (though rare for guest)
          newItems[existingItemIndex].price = priceToUse;
        } else {
          // Push new item structure matching backend response
          newItems.push({
            _id: Date.now().toString(), // Temp ID
            product: { 
              ...product, 
              _id: product._id 
            },
            quantity,
            price: priceToUse, // ✅ Using correct determined price
            selectedSize: size,
            selectedColor: color,
            shippingAmount: 0,
            taxAmount: 0
          });
        }
        
        return calculateTotals(newItems);
      });
      toast.success('Added to cart');
    }
  }, [user]);

  // --- 3. Update Quantity ---
  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) return;

    if (user) {
      try {
        // Backend recalculates price/tax/shipping
        const data = await cartApi.updateCartItem(cartItemId, quantity);
        setCart(data.cart);
      } catch (error) {
        console.error(error);
        toast.error('Failed to update quantity');
      }
    } else {
      setCart(prev => {
        const newItems = prev.items.map(item => 
          (item._id === cartItemId || item.product._id === cartItemId) 
            ? { ...item, quantity } 
            : item
        );
        return calculateTotals(newItems);
      });
    }
  }, [user]);

  // --- 4. Remove Item ---
  const removeFromCart = useCallback(async (cartItemId) => {
    if (user) {
      try {
        const data = await cartApi.removeFromCart(cartItemId);
        setCart(data.cart);
        toast.success('Item removed');
      } catch (error) {
        console.error(error);
        toast.error('Failed to remove item');
      }
    } else {
      setCart(prev => {
        const newItems = prev.items.filter(item => 
          item._id !== cartItemId && item.product._id !== cartItemId
        );
        return calculateTotals(newItems);
      });
      toast.success('Item removed');
    }
  }, [user]);

  // --- 5. Clear Cart ---
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
    }
  }, [user]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    fetchCart, 
    itemCount: cart.totalItems || 0,
    loading
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};