import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { CartItem, Product, Order, Address, PaymentMethod } from '@/types';
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
  addOrder: (address: Address, missingItemPreference: 'substituir' | 'remover', paymentMethod: PaymentMethod, installments?: number, customTotal?: number) => Promise<Order>;
  repeatOrder: (order: Order) => void;
  refreshOrders: () => Promise<void>;
  loading: boolean;
  editingOrderId: string | null;
  startEditingOrder: (order: Order) => void;
  updateOrder: (address: Address, missingItemPreference: 'substituir' | 'remover', paymentMethod: PaymentMethod, installments?: number, customTotal?: number) => Promise<void>;
  cancelEditing: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mercadofacil_cart';
const BUDGET_STORAGE_KEY = 'mercadofacil_budget';
const DEFAULT_BUDGET = 300;

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const isValidItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Number.isFinite(Number(item.price)) &&
    Number.isFinite(Number(item.quantity)) &&
    Number(item.quantity) > 0
  );
};

const readStoredCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidItem).map((item) => ({
      ...item,
      price: Number(item.price),
      quantity: Math.max(1, Math.floor(Number(item.quantity))),
    }));
  } catch (error) {
    console.warn('Could not restore cart from storage:', error);
    return [];
  }
};

const readStoredBudget = (): number => {
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return DEFAULT_BUDGET;
    const parsed = Number(JSON.parse(raw));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BUDGET;
  } catch (error) {
    console.warn('Could not restore budget from storage:', error);
    return DEFAULT_BUDGET;
  }
};

/** Normalizes a Brazilian phone number to the format expected by the bot. */
const toWhatsAppNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredCart());
  const [budget, setBudgetState] = useState<number>(() => readStoredBudget());
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Persist cart/budget defensively (storage can be unavailable).
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('Could not persist cart:', error);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budget));
    } catch (error) {
      console.warn('Could not persist budget:', error);
    }
  }, [budget]);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ignore stale responses (user changed or a newer request started).
      if (!mountedRef.current || requestId !== requestIdRef.current) return;

      const transformedOrders: Order[] = (data ?? []).map((row) => ({
        id: String(row.order_number ?? row.id),
        items: (row.items as CartItem[]) ?? [],
        budget: Number(row.budget) || 0,
        total: Number(row.total) || 0,
        savings: Number(row.savings) || 0,
        status: row.status as Order['status'],
        address: row.address as Address,
        missingItemPreference: (row.missing_item_preference === 'credito' ? 'remover' : row.missing_item_preference) as 'substituir' | 'remover',
        createdAt: row.created_at,
        estimatedDelivery: row.estimated_delivery ?? undefined,
        paymentMethod: row.payment_method ?? undefined,
        installments: row.installments ?? undefined,
        paymentDay: row.payment_day ?? undefined,
        paymentDate: row.payment_date ?? undefined,
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void loadOrders();
    } else {
      setOrders([]);
      setEditingOrderId(null);
    }
  }, [user, loadOrders]);

  const total = useMemo(
    () => roundCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    [items]
  );
  const remaining = roundCurrency(budget - total);
  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const isOverBudget = total > budget;
  const savings = roundCurrency(Math.max(0, budget - total));

  const setBudget = useCallback((value: number) => {
    const next = Number(value);
    setBudgetState(Number.isFinite(next) && next > 0 ? roundCurrency(next) : DEFAULT_BUDGET);
  }, []);

  const addItem = (product: Product) => {
    if (!product || !product.id) return;
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
    const nextQuantity = Math.floor(Number(quantity));
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const addOrder = async (
    address: Address,
    missingItemPreference: 'substituir' | 'remover',
    paymentMethod: PaymentMethod,
    installments: number = 1,
    customTotal?: number
  ): Promise<Order> => {
    if (!user) {
      throw new Error('User must be logged in to create an order');
    }
    if (items.length === 0) {
      throw new Error('O carrinho está vazio');
    }

    const orderNumber = `ORD-${Date.now()}`;
    const orderTotal = roundCurrency(customTotal ?? total);
    const order: Order = {
      id: orderNumber,
      items: items.map((item) => ({ ...item })),
      budget,
      total: orderTotal,
      savings,
      status: 'processando',
      address,
      missingItemPreference,
      paymentMethod,
      installments,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };

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
        payment_method: order.paymentMethod,
        installments: order.installments,
        created_at: order.createdAt,
        estimated_delivery: order.estimatedDelivery,
      }]);

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    setOrders((prev) => [order, ...prev]);
    clearCart();

    // Send WhatsApp notification asynchronously; order creation must never fail
    // because the bot is offline.
    void (async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('name, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (!userData?.phone) return;

        const orderWithUser = {
          ...order,
          user: { phone: userData.phone, name: userData.name },
        };

        const message = await getWhatsAppMessage('processando', orderWithUser);
        const sent = await sendWhatsAppMessage(toWhatsAppNumber(userData.phone), message);

        if (!sent) {
          console.log(`WhatsApp notification not sent for order ${orderNumber} (bot may be offline)`);
        }
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError);
      }
    })();

    return order;
  };

  const repeatOrder = (order: Order) => {
    // Deep-copy so edits in the new cart never mutate historical order data.
    setItems(order.items.map((item) => ({ ...item })));
    setBudget(order.budget);
  };

  const startEditingOrder = (order: Order) => {
    setItems(order.items.map((item) => ({ ...item })));
    setBudget(order.budget);
    setEditingOrderId(order.id);
  };

  const cancelEditing = () => {
    setEditingOrderId(null);
    clearCart();
  };

  const updateOrder = async (
    address: Address,
    missingItemPreference: 'substituir' | 'remover',
    paymentMethod: PaymentMethod,
    installments: number = 1,
    customTotal?: number
  ): Promise<void> => {
    if (!user || !editingOrderId) {
      throw new Error('No user or order to edit');
    }
    if (items.length === 0) {
      throw new Error('O carrinho está vazio');
    }

    const updatedTotal = roundCurrency(customTotal ?? items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const updatedSavings = roundCurrency(Math.max(0, budget - updatedTotal));

    const { data, error } = await supabase
      .from('orders')
      .update({
        items,
        budget,
        total: updatedTotal,
        savings: updatedSavings,
        address,
        missing_item_preference: missingItemPreference,
        payment_method: paymentMethod,
        installments,
      })
      .eq('order_number', editingOrderId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Pedido não encontrado ou não pertence ao usuário');
    }

    await loadOrders();
    setEditingOrderId(null);
    clearCart();
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
