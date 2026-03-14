-- Create users table for authentication
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin' or 'user'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username for faster lookups
CREATE INDEX idx_users_username ON users(username);

-- NOTE: Do NOT seed default admin credentials in production.
-- Use the /api/auth/bootstrap endpoint with BOOTSTRAP_TOKEN, or create
-- the initial admin user directly via a secure admin-only process.

