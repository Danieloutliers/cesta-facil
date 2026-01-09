-- Migration: Add order tracking to consumers table
-- Run this if you already created the consumers table from the previous migration

-- Add new columns to existing consumers table
ALTER TABLE consumers 
ADD COLUMN IF NOT EXISTS last_order_total NUMERIC,
ADD COLUMN IF NOT EXISTS last_order_number TEXT,
ADD COLUMN IF NOT EXISTS payment_day INTEGER,
ADD COLUMN IF NOT EXISTS payment_day INTEGER,
ADD COLUMN IF NOT EXISTS last_delivery_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_installments INTEGER;
