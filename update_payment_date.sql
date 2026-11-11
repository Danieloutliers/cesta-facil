-- Add payment_date to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Add payment_date to consumers for default/preference
ALTER TABLE consumers
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
