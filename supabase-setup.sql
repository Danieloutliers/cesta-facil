-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create budget_options table
CREATE TABLE IF NOT EXISTS budget_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value NUMERIC NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  popular BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default budget options
INSERT INTO budget_options (value, label, description, popular) VALUES 
  (200, 'R$ 200', 'Essencial para 1 pessoa', false),
  (300, 'R$ 300', 'Ideal para casal', true),
  (400, 'R$ 400', 'Família pequena', false),
  (500, 'R$ 500', 'Família média', false),
  (600, 'R$ 600', 'Família grande', false),
  (700, 'R$ 700', 'Cesta completa', false)
ON CONFLICT DO NOTHING;

-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Allow public access to product images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('deliveryFee', '5.0'),
  ('deliveryRadius', '10'),
  ('estimatedDeliveryTime', '60'),
  ('workingHours', '{"start": "08:00", "end": "18:00"}'),
  ('isOpen', 'true')
ON CONFLICT (key) DO NOTHING;
