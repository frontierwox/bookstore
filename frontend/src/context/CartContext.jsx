import React, { createContext, useContext, useState } from 'react'
import { cartApi } from '../services/cart'

const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [totalItems, setTotalItems] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Refresh cart from server
  const refreshCart = async () => {
    try {
      const data = await cartApi.getCart()
      if (data.cart) {
        setTotalItems(data.cart.totalItems || 0)
      }
    } catch (error) {
      console.error('Error refreshing cart:', error)
    }
  }

  // Update cart item count (optimistic update)
  const addToCart = () => {
    setTotalItems(prev => prev + 1)
  }

  // Remove from cart count
  const removeFromCart = () => {
    setTotalItems(prev => Math.max(0, prev - 1))
  }

  // Open cart sidebar
  const openCart = () => {
    setIsCartOpen(true)
  }

  // Close cart sidebar
  const closeCart = () => {
    setIsCartOpen(false)
  }

  return (
    <CartContext.Provider
      value={{
        totalItems,
        isCartOpen,
        refreshCart,
        addToCart,
        removeFromCart,
        openCart,
        closeCart
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
