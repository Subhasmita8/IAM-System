-- ============================================================
-- IAM System - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS iam_db;
USE iam_db;

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,        -- 'admin', 'manager', 'user'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,       -- 'users:read', 'users:create', etc.
  resource VARCHAR(50) NOT NULL,           -- 'users', 'roles', 'reports'
  action VARCHAR(50) NOT NULL,             -- 'create', 'read', 'update', 'delete'
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Store hashed token, not raw
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE,
  ip_address VARCHAR(45),                  -- IPv4 or IPv6
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin',   'Full system access'),
  ('manager', 'Department management access'),
  ('user',    'Standard user access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  ('users:create', 'users', 'create', 'Create new users'),
  ('users:read',   'users', 'read',   'View user list and details'),
  ('users:update', 'users', 'update', 'Update user information'),
  ('users:delete', 'users', 'delete', 'Delete users'),
  ('roles:create', 'roles', 'create', 'Create new roles'),
  ('roles:read',   'roles', 'read',   'View roles'),
  ('roles:update', 'roles', 'update', 'Update roles'),
  ('roles:delete', 'roles', 'delete', 'Delete roles'),
  ('reports:read', 'reports', 'read', 'View reports')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Assign ALL permissions to admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Assign read + update to manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('users:read', 'users:update', 'reports:read', 'roles:read')
WHERE r.name = 'manager'
ON DUPLICATE KEY UPDATE granted_at = granted_at;

-- Assign only read to user
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('users:read')
WHERE r.name = 'user'
ON DUPLICATE KEY UPDATE granted_at = granted_at;
