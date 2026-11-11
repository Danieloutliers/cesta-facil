-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    email TEXT,
    address JSONB, -- { street, number, neighborhood, city, ... }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    order_number SERIAL,
    status TEXT NOT NULL DEFAULT 'processando', -- processando, separando, saiu_para_entrega, entregue, cancelado
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    items JSONB, -- Array de objetos: [{ name, quantity, price }]
    address JSONB, -- Endereço de entrega (snapshot)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security) - Permissiva para testes, RESTRIVA para produção
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Simplificadas para funcionar com a chave anon por enquanto)
-- IDEAL: Usar roles autenticados. A chave do bot no .env é 'anon', então precisamos permitir acesso anon
-- OU (Recomendado): Usar a chave SERVICE_ROLE no bot para acesso total sem RLS, mas o .env tem anon.

-- Vamos criar políticas permissivas para ANON (Cuidado em produção!)
CREATE POLICY "Public Access Customers" ON public.customers FOR ALL USING (true);
CREATE POLICY "Public Access Orders" ON public.orders FOR ALL USING (true);

-- Índices para busca rápida por telefone
CREATE INDEX IF NOT EXISTS customers_phone_idx ON public.customers(phone);
