// context/CartContext.jsx
import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import { cartApi } from '../services/cart';
import { AuthContext } from './AuthContext';
import toast from 'react-hot-toast';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [loading, setLoading] = useState(false);

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

  // Fetch Cart
  const fetchCart = useCallback(async () => {
    if (user) {
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
      const saved = localStorage.getItem('guestCart');
      if (saved) {
        setCart(JSON.parse(saved));
      } else {
        setCart({ items: [], totalAmount: 0, totalItems: 0 });
      }
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Persist Guest Cart
  useEffect(() => {
    if (!user) {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    }
  }, [cart, user]);

  // ✅ FIX: Add to Cart - simplified payload structure
  const addToCart = useCallback(async (productData, quantity = 1) => {
    // Handle both direct calls and calls with embedded product object
    const productId = productData.product || productData._id;
    const size = productData.selectedSize || productData.sizes?.[0] || 'Free Size';
    const color = productData.selectedColor || productData.colors?.[0] || 'Standard';

    const isReseller = user?.role === 'reseller';
    const priceToUse = (isReseller && productData.wholesalePrice > 0) 
      ? Number(productData.wholesalePrice) 
      : Number(productData.price);

    // ✅ Correct payload structure matching backend expectations
    const payload = {
      product: productId,
      quantity,
      selectedSize: size,
      selectedColor: color
    };

    if (user) {
      try {
        const data = await cartApi.addToCart(payload, quantity);
        setCart(data.cart);
        toast.success(isReseller ? 'Added to wholesale order' : 'Added to cart');
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error(error.response?.data?.message || 'Failed to add item');
      }
    } else {
      // Guest cart logic
      setCart(prev => {
        const existingItemIndex = prev.items.findIndex(item => 
          item.product._id === productId && 
          item.selectedColor === color &&
          item.selectedSize === size
        );

        let newItems = [...prev.items];
        
        if (existingItemIndex > -1) {
          newItems[existingItemIndex].quantity += quantity;
          newItems[existingItemIndex].price = priceToUse;
        } else {
          newItems.push({
            _id: Date.now().toString(),
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
      toast.success('Added to cart');
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

  // Remove Item
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