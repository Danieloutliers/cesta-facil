-- Banner Management System Setup
-- Run this in Supabase SQL Editor

-- Create banners table
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  gradient TEXT NOT NULL DEFAULT 'from-violet-600 to-indigo-600',
  icon TEXT NOT NULL DEFAULT 'ShoppingBag',
  button_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public can view active banners" ON banners
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage banners" ON banners
  FOR ALL USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);

-- Insert initial banners (migrating from existing code)
INSERT INTO banners (title, description, image_url, gradient, icon, button_text, display_order, active) VALUES
  ('Ofertas da Semana', 'Descontos imperdíveis em produtos selecionados para sua despensa.', '/banner_promo_geral.jpg', 'from-violet-600 to-indigo-600', 'Percent', 'Ver Ofertas', 1, true),
  ('Festival de Carnes', 'Cortes selecionados para seu churrasco com preços especiais.', '/banner_carnes.jpg', 'from-red-600 to-rose-600', 'Beef', 'Confira', 2, true),
  ('Hortifruti Fresquinho', 'Frutas, legumes e verduras direto do produtor para sua mesa.', '/banner_hortifruti.jpg', 'from-green-600 to-emerald-600', 'Apple', 'Aproveite', 3, true),
  ('Compre e Pague Parcelado', 'Facilidade total! Parcele suas compras sem juros no cartão.', '/banner_pagamento.jpg', 'from-blue-600 to-cyan-600', 'CreditCard', 'Saiba Mais', 4, true),
  ('Entrega Rápida', 'Receba suas compras no conforto de casa em tempo recorde.', '/banner_entrega.jpg', 'from-orange-500 to-amber-500', 'Truck', 'Pedir Agora', 5, true)
ON CONFLICT DO NOTHING;

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Public can view banner images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'banner-images');

CREATE POLICY "Authenticated can upload banner images" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update banner images" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete banner images" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'banner-images' AND auth.role() = 'authenticated');
