// SQL Schema for call-me-back-db
// This file contains all database table definitions and indexes

export const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email_verified INTEGER DEFAULT 0,
  phone_verified INTEGER DEFAULT 0,
  stripe_customer_id TEXT,
  default_payment_method TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_stripe ON users(stripe_customer_id);

-- Personas table
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  voice TEXT NOT NULL,
  system_prompt TEXT NOT NULL,
  is_public INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(created_by, name)
);

CREATE INDEX IF NOT EXISTS idx_personas_public ON personas(is_public);
CREATE INDEX IF NOT EXISTS idx_personas_created_by ON personas(created_by);
CREATE INDEX IF NOT EXISTS idx_personas_name ON personas(name);

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  duration INTEGER,
  cost REAL,
  sid TEXT,
  transcript TEXT,
  error_message TEXT,
  payment_intent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_calls_user_status ON calls(user_id, status);
CREATE INDEX IF NOT EXISTS idx_calls_start_time ON calls(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_sid ON calls(sid);
CREATE INDEX IF NOT EXISTS idx_calls_user_created ON calls(user_id, created_at DESC);

-- Scheduled calls table
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  payment_intent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduled_user_status ON scheduled_calls(user_id, status);
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON scheduled_calls(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_status_time ON scheduled_calls(status, scheduled_time);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  added_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, persona_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_persona ON contacts(persona_id);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  stripe_pm_id TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'card',
  last4 TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe ON payment_methods(stripe_pm_id);

-- Token blacklist table
CREATE TABLE IF NOT EXISTS token_blacklist (
  token_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON token_blacklist(user_id);
`;
