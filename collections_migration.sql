-- Create receivables table
CREATE TABLE IF NOT EXISTS receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID, -- References orders.id or order_number depending on schema. UUID preferred if available.
    customer_id UUID REFERENCES consumers(id),
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM notes table
CREATE TABLE IF NOT EXISTS crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES consumers(id),
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('promessa', 'contato', 'observacao')) DEFAULT 'observacao',
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add risk stats to consumers
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS risk_status TEXT CHECK (risk_status IN ('safe', 'attention', 'risk')) DEFAULT 'safe';
ALTER TABLE consumers ADD COLUMN IF NOT EXISTS next_follow_up DATE;
