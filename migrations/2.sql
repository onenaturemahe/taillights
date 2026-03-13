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

-- Insert default admin user (username: admin, password: admin123)
-- Password hash generated with bcrypt (rounds: 10)
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$Fd6nr4tLPeewR3zMXV41QOwpRhqKl4N.V0.W7RROCYC/7bQ9awRzW', 'admin');

