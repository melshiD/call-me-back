-- Add phone_verified column to users table (required for auth/me endpoint)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);
