CREATE TABLE IF NOT EXISTS snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  source TEXT NOT NULL,
  demo_mode INTEGER NOT NULL,
  signal_count INTEGER NOT NULL,
  market_count INTEGER NOT NULL,
  payload TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_created_at
ON snapshots(created_at DESC);
