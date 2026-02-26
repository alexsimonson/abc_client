import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useToast } from "../components/Toast";

// Cart limits - must match server-side validation
const MAX_QUANTITY_PER_ITEM = 10;
const MAX_TOTAL_CART_ITEMS = 20;

export type CartItem = {
  itemId: number;
  quantity: number;
  title: string;
  priceCents: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (itemId: number, quantity: number, title: string, priceCents: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "abc_shopping_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on init
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (itemId: number, quantity: number, title: string, priceCents: number) => {
    // Validate before updating state to avoid setState during render
    const existing = items.find((item) => item.itemId === itemId);
    const currentTotal = items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (existing) {
      const newItemQuantity = existing.quantity + quantity;
      
      // Check per-item limit
      if (newItemQuantity > MAX_QUANTITY_PER_ITEM) {
        showToast(`Cannot add more than ${MAX_QUANTITY_PER_ITEM} of the same item. For larger orders, please contact us directly.`, "warning", "/contact");
        return;
      }
      
      // Check total cart limit
      if (currentTotal + quantity > MAX_TOTAL_CART_ITEMS) {
        showToast(`Cart is limited to ${MAX_TOTAL_CART_ITEMS} total items. For larger orders, please contact us directly.`, "warning", "/contact");
        return;
      }
      
      setItems((prev) =>
        prev.map((item) =>
          item.itemId === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      // New item validation
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        showToast(`Cannot add more than ${MAX_QUANTITY_PER_ITEM} of the same item. For larger orders, please contact us directly.`, "warning", "/contact");
        return;
      }
      
      if (currentTotal + quantity > MAX_TOTAL_CART_ITEMS) {
        showToast(`Cart is limited to ${MAX_TOTAL_CART_ITEMS} total items. For larger orders, please contact us directly.`, "warning", "/contact");
        return;
      }
      
      setItems((prev) => [...prev, { itemId, quantity, title, priceCents }]);
    }
  };

  const removeFromCart = (itemId: number) => {
    setItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    // Validate before updating state to avoid setState during render
    if (quantity > MAX_QUANTITY_PER_ITEM) {
      showToast(`Cannot have more than ${MAX_QUANTITY_PER_ITEM} of the same item. For larger orders, please contact us directly.`, "warning", "/contact");
      return;
    }
    
    const currentTotalWithoutItem = items.reduce((sum, item) => 
      item.itemId === itemId ? sum : sum + item.quantity, 0
    );
    
    if (currentTotalWithoutItem + quantity > MAX_TOTAL_CART_ITEMS) {
      showToast(`Cart is limited to ${MAX_TOTAL_CART_ITEMS} total items. For larger orders, please contact us directly.`, "warning", "/contact");
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotalCents = useMemo(() => {
    return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotalCents,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
