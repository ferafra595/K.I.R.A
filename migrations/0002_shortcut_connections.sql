CREATE TABLE IF NOT EXISTS shortcut_connections (id INTEGER PRIMARY KEY CHECK(id=1), token_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
