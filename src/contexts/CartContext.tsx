import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, Order, Address } from '@/types';

interface CartContextType {
  items: CartItem[];
  budget: number;
  setBudget: (budget: number) => void;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  remaining: number;
  itemCount: number;
  isOverBudget: boolean;
  savings: number;
  orders: Order[];
  addOrder: (address: Address, missingItemPreference: 'substituir' | 'credito') => Order;
  repeatOrder: (order: Order) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [budget, setBudget] = useState<number>(300);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const savedCart = localStorage.getItem('mercadofacil_cart');
    const savedBudget = localStorage.getItem('mercadofacil_budget');
    const savedOrders = localStorage.getItem('mercadofacil_orders');
    
    if (savedCart) setItems(JSON.parse(savedCart));
    if (savedBudget) setBudget(JSON.parse(savedBudget));
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  useEffect(() => {
    localStorage.setItem('mercadofacil_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('mercadofacil_budget', JSON.stringify(budget));
  }, [budget]);

  useEffect(() => {
    localStorage.setItem('mercadofacil_orders', JSON.stringify(orders));
  }, [orders]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const remaining = budget - total;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isOverBudget = total > budget;
  const savings = budget * 0.15; // Simulated savings

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const clearCart = () => setItems([]);

  const addOrder = (address: Address, missingItemPreference: 'substituir' | 'credito'): Order => {
    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: [...items],
      budget,
      total,
      savings,
      status: 'processando',
      address,
      missingItemPreference,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    setOrders((prev) => [order, ...prev]);
    clearCart();
    return order;
  };

  const repeatOrder = (order: Order) => {
    setItems(order.items);
    setBudget(order.budget);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        budget,
        setBudget,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        remaining,
        itemCount,
        isOverBudget,
        savings,
        orders,
        addOrder,
        repeatOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
