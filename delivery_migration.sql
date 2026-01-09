-- Add payment and installments to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;

-- Add customer details to users table (assuming user metadata is stored here or in a separate profiles table)
-- Note: Supabase often stores user metadata in auth.users, but for application logic we might have a public.users or public.profiles table.
-- Based on previous file reads, I'll check for a 'users' table or similar in the next steps, but providing generic safe SQL here.

-- Create a table for extended customer info if it doesn't exist (or alter existing)
CREATE TABLE IF NOT EXISTS consumers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT,
  cpf TEXT,
  rg TEXT,
  phone TEXT,
  address JSONB,
  payment_preference TEXT,
  last_order_total NUMERIC,
  last_order_number TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read consumers" ON consumers FOR SELECT USING (true);
CREATE POLICY "Authenticated insert consumers" ON consumers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update consumers" ON consumers FOR UPDATE USING (auth.role() = 'authenticated');
