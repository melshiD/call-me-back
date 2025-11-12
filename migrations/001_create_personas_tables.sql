-- Migration: Create personas and user_persona_relationships tables
-- Created: 2025-01-12
-- Description: Set up database schema for persona memory system

-- ==============================================
-- PERSONAS TABLE
-- ==============================================
-- Stores core persona definitions (shared across all users)
CREATE TABLE IF NOT EXISTS personas (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Core personality (shared across all users)
  core_system_prompt TEXT NOT NULL,

  -- Default voice settings (can be overridden per user)
  default_voice_id VARCHAR(100),
  default_voice_settings JSONB DEFAULT '{
    "stability": 0.5,
    "similarity_boost": 0.75,
    "speed": 1.0,
    "style": 0.0
  }',

  -- Metadata
  avatar_url TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  is_system_persona BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for active personas lookup
CREATE INDEX idx_personas_active ON personas(is_active);
CREATE INDEX idx_personas_category ON personas(category);

-- ==============================================
-- USER_PERSONA_RELATIONSHIPS TABLE
-- ==============================================
-- Stores user-specific customizations and relationship context
CREATE TABLE IF NOT EXISTS user_persona_relationships (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  persona_id VARCHAR(100) NOT NULL,

  -- Relationship type (e.g., "friend", "coach", "therapist", "mentor")
  relationship_type VARCHAR(100) DEFAULT 'friend',

  -- User-specific system prompt augmentation
  custom_system_prompt TEXT,

  -- User-specific voice customization
  voice_id VARCHAR(100),
  voice_settings JSONB DEFAULT '{
    "stability": 0.5,
    "similarity_boost": 0.75,
    "speed": 1.0,
    "style": 0.0
  }',

  -- Usage statistics
  total_calls INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  last_call_at TIMESTAMP,

  -- Preferences
  is_favorite BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign key constraints
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE,

  -- Unique constraint: one relationship per user-persona pair
  UNIQUE(user_id, persona_id)
);

-- Indexes for performance
CREATE INDEX idx_relationships_user ON user_persona_relationships(user_id);
CREATE INDEX idx_relationships_persona ON user_persona_relationships(persona_id);
CREATE INDEX idx_relationships_user_persona ON user_persona_relationships(user_id, persona_id);
CREATE INDEX idx_relationships_favorite ON user_persona_relationships(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_relationships_archived ON user_persona_relationships(is_archived) WHERE is_archived = false;

-- ==============================================
-- CALL_LOGS TABLE
-- ==============================================
-- Stores call history with cost tracking
CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  persona_id VARCHAR(100) NOT NULL,

  -- Call details
  twilio_call_sid VARCHAR(100),
  phone_number VARCHAR(50),
  duration_seconds INTEGER DEFAULT 0,

  -- Status
  status VARCHAR(50) DEFAULT 'initiated', -- initiated, connected, completed, failed
  error_message TEXT,

  -- Costs (in cents)
  cost_stt INTEGER DEFAULT 0,
  cost_llm INTEGER DEFAULT 0,
  cost_tts INTEGER DEFAULT 0,
  cost_twilio INTEGER DEFAULT 0,
  cost_total INTEGER DEFAULT 0,

  -- Conversation metrics
  turn_count INTEGER DEFAULT 0,
  interrupt_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,

  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);

-- Indexes for call history queries
CREATE INDEX idx_calls_user ON call_logs(user_id);
CREATE INDEX idx_calls_persona ON call_logs(persona_id);
CREATE INDEX idx_calls_user_persona ON call_logs(user_id, persona_id);
CREATE INDEX idx_calls_started_at ON call_logs(started_at DESC);
CREATE INDEX idx_calls_status ON call_logs(status);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Personas updated_at trigger
CREATE OR REPLACE FUNCTION update_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW
  EXECUTE FUNCTION update_personas_updated_at();

-- Relationships updated_at trigger
CREATE OR REPLACE FUNCTION update_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_relationships_updated_at
  BEFORE UPDATE ON user_persona_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_relationships_updated_at();

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE personas IS 'Core persona definitions shared across all users';
COMMENT ON TABLE user_persona_relationships IS 'User-specific persona customizations and relationship context';
COMMENT ON TABLE call_logs IS 'Call history with cost tracking and conversation metrics';

COMMENT ON COLUMN personas.core_system_prompt IS 'Base personality prompt used for all users';
COMMENT ON COLUMN personas.default_voice_id IS 'Default ElevenLabs voice ID (can be overridden per user)';
COMMENT ON COLUMN user_persona_relationships.custom_system_prompt IS 'User-specific augmentation to core personality';
COMMENT ON COLUMN user_persona_relationships.voice_id IS 'User-specific voice override (null = use persona default)';
