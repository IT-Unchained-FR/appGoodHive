CREATE TABLE IF NOT EXISTS goodhive.groq_usage (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL,
  feature TEXT NOT NULL DEFAULT 'unknown',
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS groq_usage_created_at_idx ON goodhive.groq_usage (created_at DESC);
CREATE INDEX IF NOT EXISTS groq_usage_model_idx ON goodhive.groq_usage (model);
CREATE INDEX IF NOT EXISTS groq_usage_feature_idx ON goodhive.groq_usage (feature);
