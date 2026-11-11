-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access (needed for checkout)
DROP POLICY IF EXISTS "Public read access" ON settings;
CREATE POLICY "Public read access" ON settings
FOR SELECT USING (true);

-- Allow authenticated users (admins) to manage settings
DROP POLICY IF EXISTS "Admin full access" ON settings;
CREATE POLICY "Admin full access" ON settings
FOR ALL USING (auth.role() = 'authenticated');
