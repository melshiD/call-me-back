-- Migration: Add admin user for dave.melshman@gmail.com
-- Created: 2025-11-25
-- Description: Add WorkOS OAuth admin user to admin_users table

INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at)
VALUES (
    '58271e6f-4058-411c-a996-a485b26fe941',
    'dave.melshman@gmail.com',
    'workos_oauth',  -- No password needed for OAuth users
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;

-- Also handle conflict on email if it exists
INSERT INTO admin_users (id, email, password_hash, role, created_at, updated_at)
VALUES (
    '58271e6f-4058-411c-a996-a485b26fe941',
    'dave.melshman@gmail.com',
    'workos_oauth',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE
SET id = EXCLUDED.id,
    role = EXCLUDED.role,
    updated_at = CURRENT_TIMESTAMP;
