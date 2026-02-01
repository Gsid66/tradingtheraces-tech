-- Trading Desk Authentication Tables

-- User authentication (password that admin can change)
CREATE TABLE IF NOT EXISTS trading_desk_auth (
  id SERIAL PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin authentication (fixed admin credentials)
CREATE TABLE IF NOT EXISTS trading_desk_admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
