-- CORREÇÃO DE PERMISSÕES PARA BANNERS
-- Execute este script no Editor SQL do Supabase Dashboard

-- 1. Permitir gerenciamento de banners para API pública (já que o auth é via app)
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON banners;
DROP POLICY IF EXISTS "Public can view active banners" ON banners;
DROP POLICY IF EXISTS "Public can manage banners" ON banners;

CREATE POLICY "Public can manage banners" ON banners
  FOR ALL USING (true);

-- 2. Garantir que o bucket de imagens existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Corrigir permissões de Storage (Upload de imagens)
DROP POLICY IF EXISTS "Authenticated can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete banner images" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Public can update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete banner images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view banner images" ON storage.objects;

-- Permitir tudo no bucket banner-images
CREATE POLICY "Public can view banner images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'banner-images');

CREATE POLICY "Public can upload banner images" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'banner-images');

CREATE POLICY "Public can update banner images" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'banner-images');

CREATE POLICY "Public can delete banner images" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'banner-images');
