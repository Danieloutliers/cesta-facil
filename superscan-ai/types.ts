export interface Product {
  id: string; // uuid
  name: string;
  price: number;
  category: string; // 'alimentos' | 'limpeza' | 'higiene' | 'bebidas'
  image: string; // Changed from imageUrl to match Supabase 'image' column
  description?: string;
  unit: string;
  status?: 'pending' | 'synced'; // Optional, for local UI state
  created_at?: string;
  isEnhanced?: boolean; // UI only
}

export interface ScannedData {
  name: string;
  price: number;
  category: string;
  description: string;
  unit?: string; // Adicionado para compatibilidade com DB
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  CAMERA = 'CAMERA',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}