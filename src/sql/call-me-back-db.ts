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
  call_scenario TEXT,
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

-- Call Scenario Templates table (reusable pre-call scenarios)
CREATE TABLE IF NOT EXISTS call_scenario_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scenario_text TEXT NOT NULL,
  icon TEXT DEFAULT '🎭',
  use_count INTEGER DEFAULT 0,
  last_used_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenario_templates_user ON call_scenario_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_use_count ON call_scenario_templates(use_count DESC);

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

-- User-Persona Relationships table (for personalized contexts)
CREATE TABLE IF NOT EXISTS user_persona_relationships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'friend',
  custom_system_prompt TEXT,
  memory_config TEXT DEFAULT '{"remember_relationship_details":true,"remember_past_conversations":true,"remember_personal_facts":true,"auto_recall_depth":10}',
  relationship_started_at TEXT DEFAULT (datetime('now')),
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_call_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, persona_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_persona_rel ON user_persona_relationships(user_id, persona_id);
CREATE INDEX IF NOT EXISTS idx_relationship_type ON user_persona_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_last_call ON user_persona_relationships(last_call_at DESC);

-- Call Cost Breakdowns table (comprehensive cost tracking)
CREATE TABLE IF NOT EXISTS call_cost_breakdowns (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  finalized_at TEXT,

  -- Twilio costs
  twilio_connection_fee_cents INTEGER DEFAULT 25,
  twilio_duration_seconds INTEGER DEFAULT 0,
  twilio_duration_cost_cents REAL DEFAULT 0,
  twilio_total_cents REAL DEFAULT 0,

  -- ElevenLabs costs
  elevenlabs_total_characters INTEGER DEFAULT 0,
  elevenlabs_total_requests INTEGER DEFAULT 0,
  elevenlabs_total_cents REAL DEFAULT 0,

  -- Cerebras AI costs
  cerebras_input_tokens INTEGER DEFAULT 0,
  cerebras_output_tokens INTEGER DEFAULT 0,
  cerebras_total_tokens INTEGER DEFAULT 0,
  cerebras_total_requests INTEGER DEFAULT 0,
  cerebras_total_cents REAL DEFAULT 0,

  -- OpenAI fallback costs
  openai_input_tokens INTEGER DEFAULT 0,
  openai_output_tokens INTEGER DEFAULT 0,
  openai_total_tokens INTEGER DEFAULT 0,
  openai_total_requests INTEGER DEFAULT 0,
  openai_realtime_minutes REAL DEFAULT 0,
  openai_total_cents REAL DEFAULT 0,
  openai_fallback_triggered INTEGER DEFAULT 0,
  openai_fallback_reason TEXT,

  -- STT costs (Deepgram)
  deepgram_audio_duration_seconds INTEGER DEFAULT 0,
  deepgram_total_requests INTEGER DEFAULT 0,
  deepgram_total_cents REAL DEFAULT 0,

  -- Raindrop costs
  raindrop_memory_operations INTEGER DEFAULT 0,
  raindrop_storage_kb INTEGER DEFAULT 0,
  raindrop_total_cents REAL DEFAULT 0,

  -- Totals
  subtotal_cents REAL DEFAULT 0,
  stripe_fee_cents REAL DEFAULT 0,
  total_cost_cents REAL DEFAULT 0,

  -- Metadata
  cost_calculation_version TEXT DEFAULT '1.0',
  exchange_rate REAL DEFAULT 1.0,
  currency TEXT DEFAULT 'USD',
  user_charged_cents INTEGER DEFAULT 0,
  profit_margin_cents REAL DEFAULT 0,

  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_call_cost_call_id ON call_cost_breakdowns(call_id);
CREATE INDEX IF NOT EXISTS idx_call_cost_user_id ON call_cost_breakdowns(user_id);
CREATE INDEX IF NOT EXISTS idx_call_cost_created ON call_cost_breakdowns(created_at DESC);

-- Call Cost Events table (detailed event-level tracking)
CREATE TABLE IF NOT EXISTS call_cost_events (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL,
  call_cost_breakdown_id TEXT NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  event_type TEXT NOT NULL,
  service TEXT NOT NULL,

  -- Usage metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  characters INTEGER,
  duration_seconds INTEGER,
  audio_bytes INTEGER,

  -- Cost calculation
  unit_cost REAL,
  calculated_cost_cents REAL,

  -- Request details
  request_id TEXT,
  model_used TEXT,
  success INTEGER DEFAULT 1,
  error_message TEXT,

  -- Metadata
  metadata TEXT,

  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE,
  FOREIGN KEY (call_cost_breakdown_id) REFERENCES call_cost_breakdowns(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cost_events_call ON call_cost_events(call_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_events_service ON call_cost_events(service, timestamp);
CREATE INDEX IF NOT EXISTS idx_cost_events_type ON call_cost_events(event_type);

-- User Budget Settings table (cost controls)
CREATE TABLE IF NOT EXISTS user_budget_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,

  -- Per-call limits
  max_cost_per_call_cents INTEGER DEFAULT 1000,
  warn_at_percent_per_call INTEGER DEFAULT 75,

  -- Daily limits
  max_cost_per_day_cents INTEGER DEFAULT 5000,
  warn_at_percent_per_day INTEGER DEFAULT 75,

  -- Monthly limits
  max_cost_per_month_cents INTEGER DEFAULT 10000,
  warn_at_percent_per_month INTEGER DEFAULT 75,

  -- Memory cost controls
  max_memory_tokens INTEGER DEFAULT 4000,
  warn_high_memory_cost INTEGER DEFAULT 1,

  -- Auto-cutoff settings
  enable_auto_cutoff INTEGER DEFAULT 1,
  cutoff_grace_period_seconds INTEGER DEFAULT 10,

  -- Notification preferences
  notify_on_warning INTEGER DEFAULT 1,
  notify_on_cutoff INTEGER DEFAULT 1,
  notification_method TEXT DEFAULT 'in_call',

  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budget_user ON user_budget_settings(user_id);
`;
