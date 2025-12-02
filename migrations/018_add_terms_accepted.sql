-- Add terms acceptance tracking to users table
-- This enables enforcement of Terms of Service acceptance

ALTER TABLE users
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for querying users who haven't accepted terms
CREATE INDEX IF NOT EXISTS idx_users_terms_accepted ON users(terms_accepted_at);

-- Comment for documentation
COMMENT ON COLUMN users.terms_accepted_at IS 'Timestamp when user accepted Terms of Service. NULL means not yet accepted.';
