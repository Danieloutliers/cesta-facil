-- Create subcategories table
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add subcategory_id to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

-- Create policies (modify as needed for your auth setup)
CREATE POLICY "Allow public read access" ON public.subcategories FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.subcategories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated update" ON public.subcategories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated delete" ON public.subcategories FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some default subcategories (Example data)
-- You might want to run this manually or adjust labels/category_ids based on your existing categories.
-- Assuming 'alimentos', 'limpeza', 'higiene', 'bebidas' are your category IDs.

INSERT INTO public.subcategories (label, category_id) VALUES
('Arroz e Feijão', 'alimentos'),
('Massas e Molhos', 'alimentos'),
('Óleos e Temperos', 'alimentos'),
('Biscoitos e Snacks', 'alimentos'),
('Matinais', 'alimentos'),
('Doces e Sobremesas', 'alimentos'),
('Refrigerantes', 'bebidas'),
('Sucos', 'bebidas'),
('Água', 'bebidas'),
('Cervejas', 'bebidas'),
('Sabão e Amaciante', 'limpeza'),
('Desinfetantes', 'limpeza'),
('Utensílios', 'limpeza'),
('Banho', 'higiene'),
('Cabelo', 'higiene'),
('Bucal', 'higiene');
