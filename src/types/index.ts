export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'alimentos' | 'limpeza' | 'higiene' | 'bebidas';
  unit: string;
  description?: string;
  subcategory_id?: string;
  cost_price?: number;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao' | 'carne';

export interface SubCategory {
  id: string;
  label: string;
  category_id: string;
}

export interface PriceHistoryItem {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  old_cost: number;
  new_cost: number;
  changed_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  budget: number;
  total: number;
  savings: number;
  status: 'processando' | 'separando' | 'em_rota' | 'entregue' | 'saiu_para_entrega' | 'cancelado';
  address: Address;
  missingItemPreference: 'substituir' | 'remover';
  createdAt: string;
  estimatedDelivery?: string;
  paymentMethod?: PaymentMethod;
  installments?: number;
  paymentDay?: number;
  paymentDate?: string;
}

export interface Consumer {
  id: string;
  fullName: string;
  cpf: string;
  rg?: string;
  phone: string;
  address: Address;
  paymentPreference?: string;
}

export interface Address {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface BudgetOption {
  value: number;
  label: string;
  description: string;
  popular?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  order?: number;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  gradient: string;
  icon: string;
  button_text?: string;
  link?: string;
  display_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}
