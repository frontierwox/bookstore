import React, { createContext, useState, useCallback, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : { items: [], totalAmount: 0, totalItems: 0 };
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const calculateTotals = useCallback((items) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.discountPrice || item.price) * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    return { totalAmount, totalItems };
  }, []);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prev => {
      const existingItem = prev.items.find(item => item._id === product._id);
      let newItems;
      if (existingItem) {
        newItems = prev.items.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newItems = [...prev.items, { ...product, quantity }];
      }
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals
      };
    });
  }, [calculateTotals]);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
      const newItems = prev.items.filter(item => item._id !== productId);
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals
      };
    });
  }, [calculateTotals]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => {
      const newItems = prev.items.map(item =>
        item._id === productId
          ? { ...item, quantity }
          : item
      );
      const totals = calculateTotals(newItems);
      return {
        items: newItems,
        ...totals
      };
    });
  }, [removeFromCart, calculateTotals]);

  const clearCart = useCallback(() => {
    setCart({ items: [], totalAmount: 0, totalItems: 0 });
  }, []);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    itemCount: cart.totalItems,
    totalItems: cart.totalItems // for backward compatibility
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
