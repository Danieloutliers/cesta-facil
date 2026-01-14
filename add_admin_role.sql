-- Add is_admin column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Set the admin phone number (77988551433)
UPDATE users SET is_admin = true WHERE phone = '5577988551433';
UPDATE users SET is_admin = true WHERE phone = '77988551433';
UPDATE users SET is_admin = true WHERE phone = '+5577988551433';

-- Ensure all other users are NOT admin
UPDATE users SET is_admin = false WHERE phone NOT IN ('5577988551433', '77988551433', '+5577988551433');
