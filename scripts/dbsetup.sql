-- brightmind schema (PostgreSQL) with table prefixes and indexes

CREATE TABLE brightmind_users (
  id SERIAL PRIMARY KEY,
  pubkey TEXT UNIQUE NOT NULL,
  balance_sats INTEGER DEFAULT 300,
  streak_count INTEGER DEFAULT 0,
  last_prompt_sent DATE,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_until DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_brightmind_users_pubkey ON brightmind_users(pubkey);

CREATE TABLE brightmind_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES brightmind_users(id),
  module TEXT NOT NULL,
  prompt TEXT,
  response TEXT,
  ai_response TEXT,
  cost_sats INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_brightmind_entries_user_id ON brightmind_entries(user_id);
CREATE INDEX idx_brightmind_entries_module ON brightmind_entries(module);
CREATE INDEX idx_brightmind_entries_created_at ON brightmind_entries(created_at);

CREATE TABLE brightmind_usage_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES brightmind_users(id),
  module TEXT NOT NULL,
  sats_spent INTEGER NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_brightmind_usage_logs_user_id ON brightmind_usage_logs(user_id);
CREATE INDEX idx_brightmind_usage_logs_created_at ON brightmind_usage_logs(created_at);

CREATE TABLE brightmind_zaps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES brightmind_users(id),
  amount_sats INTEGER NOT NULL,
  tx_id TEXT UNIQUE,
  zap_note TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_brightmind_zaps_user_id ON brightmind_zaps(user_id);
CREATE INDEX idx_brightmind_zaps_created_at ON brightmind_zaps(created_at);

CREATE TABLE brightmind_insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES brightmind_users(id),
  summary TEXT,
  week_start DATE,
  week_end DATE,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_brightmind_insights_user_id ON brightmind_insights(user_id);
CREATE INDEX idx_brightmind_insights_week_start ON brightmind_insights(week_start);


ALTER TABLE brightmind_users
ADD COLUMN assistant_id TEXT,
ADD COLUMN thread_id TEXT,
ADD COLUMN last_thread_at TIMESTAMP;

ALTER TABLE brightmind_users ADD COLUMN warned_at TIMESTAMP;


