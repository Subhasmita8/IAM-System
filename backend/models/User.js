// models/User.js
// Data access layer for users table — all raw SQL queries live here

const { pool } = require('../config/db');

class User {
  /** Find a user by email (used during login) */
  static async findByEmail(email) {
    const [rows] = await pool.execute(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.is_active = TRUE
       LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  /** Find a user by ID */
  static async findById(id) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.is_active, u.last_login, u.created_at,
              r.id AS role_id, r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.is_active = TRUE
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /** Find user by username (duplicate check) */
  static async findByUsername(username) {
    const [rows] = await pool.execute(
      `SELECT id FROM users WHERE username = ? LIMIT 1`,
      [username]
    );
    return rows[0] || null;
  }

  /** Create a new user, returns insertId */
  static async create({ username, email, passwordHash, roleId }) {
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, roleId]
    );
    return result.insertId;
  }

  /** List all users with pagination */
  static async findAll({ limit = 50, offset = 0 } = {}) {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.email, u.is_active, u.last_login, u.created_at,
              r.name AS role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  /** Update a user's role */
  static async updateRole(userId, roleId) {
    const [result] = await pool.execute(
      `UPDATE users SET role_id = ? WHERE id = ?`,
      [roleId, userId]
    );
    return result.affectedRows > 0;
  }

  /** Update last_login timestamp */
  static async updateLastLogin(userId) {
    await pool.execute(`UPDATE users SET last_login = NOW() WHERE id = ?`, [userId]);
  }

  /** Hard delete a user */
  static async delete(userId) {
    const [result] = await pool.execute(`DELETE FROM users WHERE id = ?`, [userId]);
    return result.affectedRows > 0;
  }

  /** Soft-deactivate a user */
  static async deactivate(userId) {
    const [result] = await pool.execute(
      `UPDATE users SET is_active = FALSE WHERE id = ?`, [userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
