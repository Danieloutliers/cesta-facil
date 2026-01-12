import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, Order, Address } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { sendWhatsAppMessage, getWhatsAppMessage } from '@/lib/whatsapp';

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
  addOrder: (address: Address, missingItemPreference: 'substituir' | 'credito') => Promise<Order>;
  repeatOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
  loading: boolean;
  editingOrderId: string | null;
  startEditingOrder: (order: Order) => void;
  updateOrder: (address: Address, missingItemPreference: 'substituir' | 'credito') => Promise<void>;
  cancelEditing: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [budget, setBudget] = useState<number>(300);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const { user } = useAuth();

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('mercadofacil_cart');
    const savedBudget = localStorage.getItem('mercadofacil_budget');

    if (savedCart) setItems(JSON.parse(savedCart));
    if (savedBudget) setBudget(JSON.parse(savedBudget));
  }, []);

  // Load orders from Supabase when user changes
  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('mercadofacil_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('mercadofacil_budget', JSON.stringify(budget));
  }, [budget]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform Supabase data to Order format
      const transformedOrders: Order[] = data.map((row) => ({
        id: row.order_number,
        items: row.items as CartItem[],
        budget: Number(row.budget),
        total: Number(row.total),
        savings: Number(row.savings),
        status: row.status as Order['status'],
        address: row.address as Address,
        missingItemPreference: row.missing_item_preference as 'substituir' | 'credito',
        createdAt: row.created_at,
        estimatedDelivery: row.estimated_delivery,
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const addOrder = async (address: Address, missingItemPreference: 'substituir' | 'credito'): Promise<Order> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }

    const orderNumber = `ORD-${Date.now()}`;
    const order: Order = {
      id: orderNumber,
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

    try {
      // Save to Supabase
      const { error } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: orderNumber,
          items: order.items,
          budget: order.budget,
          total: order.total,
          savings: order.savings,
          status: order.status,
          address: order.address,
          missing_item_preference: order.missingItemPreference,
          created_at: order.createdAt,
          estimated_delivery: order.estimatedDelivery,
        }]);

      if (error) throw error;

      // Update local state
      setOrders((prev) => [order, ...prev]);
      clearCart();

      // Send WhatsApp notification (async, non-blocking)
      // This happens after order creation to ensure the order is saved even if WhatsApp fails
      (async () => {
        try {
          // Get user data for message
          const { data: userData } = await supabase
            .from('users')
            .select('name, phone')
            .eq('id', user.id)
            .single();

          if (userData) {
            const orderWithUser = {
              ...order,
              user: {
                phone: userData.phone,
                name: userData.name,
              }
            };

            const message = await getWhatsAppMessage('processando', orderWithUser);
            const phoneNumber = `55${userData.phone}`;
            const sent = await sendWhatsAppMessage(phoneNumber, message);

            if (sent) {
              console.log(`✅ WhatsApp message sent successfully for order ${orderNumber}`);
            } else {
              console.log(`⚠️ Failed to send WhatsApp message for order ${orderNumber} (bot may be offline)`);
            }
          }
        } catch (whatsappError) {
          console.error('Error sending WhatsApp notification:', whatsappError);
          // Don't throw - we don't want to fail order creation if WhatsApp fails
        }
      })();

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const repeatOrder = (order: Order) => {
    setItems(order.items);
    setBudget(order.budget);
  };

  const startEditingOrder = (order: Order) => {
    setItems(order.items);
    setBudget(order.budget);
    setEditingOrderId(order.id);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    clearCart();
  };

  const updateOrder = async (address: Address, missingItemPreference: 'substituir' | 'credito'): Promise<void> => {
    if (!user || !editingOrderId) {
      throw new Error('No user or order to edit');
    }

    const updatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const updatedSavings = budget * 0.15; // Re-calculate savings if needed

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          items: items,
          budget: budget,
          total: updatedTotal,
          savings: updatedSavings,
          address: address,
          missing_item_preference: missingItemPreference,
          updated_at: new Date().toISOString()
        })
        .eq('order_number', editingOrderId);

      if (error) throw error;

      // Update local state by re-fetching
      await loadOrders();

      // Reset editing state
      setEditingOrderId(null);
      clearCart();

    } catch (error) {
      console.error('Error updating order:', error);
      throw error;
    }
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
        refreshOrders: loadOrders,
        loading,
        editingOrderId,
        startEditingOrder,
        updateOrder,
        cancelEditing
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
