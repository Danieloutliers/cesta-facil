export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'alimentos' | 'limpeza' | 'higiene' | 'bebidas';
  unit: string;
  description?: string;
  subcategory_id?: string;
}

export interface SubCategory {
  id: string;
  label: string;
  category_id: string;
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
  status: 'processando' | 'separando' | 'em_rota' | 'entregue';
  address: Address;
  missingItemPreference: 'substituir' | 'credito';
  createdAt: string;
  estimatedDelivery?: string;
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
