-- Create token blacklist for JWT revocation
CREATE TABLE token_blacklist (
    token_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create user budget settings
CREATE TABLE user_budget_settings (
    user_id VARCHAR(255) PRIMARY KEY,
    max_cost_per_call_cents INTEGER DEFAULT 1000,
    max_monthly_spend_cents INTEGER DEFAULT 10000,
    warn_at_percent_per_call INTEGER DEFAULT 75,
    enable_auto_cutoff BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create call cost events for granular tracking
CREATE TABLE call_cost_events (
    id VARCHAR(255) PRIMARY KEY,
    call_id VARCHAR(255) NOT NULL,
    call_cost_breakdown_id VARCHAR(255),
    event_type VARCHAR(50),
    service VARCHAR(50),
    tokens_input INTEGER,
    tokens_output INTEGER,
    characters INTEGER,
    duration_seconds NUMERIC,
    audio_bytes INTEGER,
    unit_cost NUMERIC,
    calculated_cost_cents NUMERIC,
    model_used VARCHAR(100),
    metadata TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(id)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_token_blacklist_user ON token_blacklist(user_id);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX idx_budget_settings_user ON user_budget_settings(user_id);
CREATE INDEX idx_cost_events_call ON call_cost_events(call_id);
CREATE INDEX idx_cost_events_breakdown ON call_cost_events(call_cost_breakdown_id);
