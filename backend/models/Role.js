// models/Role.js
// Data access layer for roles and permissions

const { pool } = require('../config/db');

class Role {
  /** Find a role by name */
  static async findByName(name) {
    const [rows] = await pool.execute(`SELECT * FROM roles WHERE name = ? LIMIT 1`, [name]);
    return rows[0] || null;
  }

  /** Find a role by id */
  static async findById(id) {
    const [rows] = await pool.execute(`SELECT * FROM roles WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  }

  /** Get all roles with permission counts */
  static async findAll() {
    const [rows] = await pool.execute(
      `SELECT r.*, COUNT(rp.permission_id) AS permission_count
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       GROUP BY r.id
       ORDER BY r.name`
    );
    return rows;
  }

  /** Create a new role */
  static async create({ name, description }) {
    const [result] = await pool.execute(
      `INSERT INTO roles (name, description) VALUES (?, ?)`,
      [name, description || null]
    );
    return result.insertId;
  }

  /** Get all permissions for a role */
  static async getPermissions(roleId) {
    const [rows] = await pool.execute(
      `SELECT p.name, p.resource, p.action
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows;
  }

  /** Assign a permission to a role */
  static async assignPermission(roleId, permissionId) {
    await pool.execute(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      [roleId, permissionId]
    );
  }

  /** Get all available permissions */
  static async getAllPermissions() {
    const [rows] = await pool.execute(`SELECT * FROM permissions ORDER BY resource, action`);
    return rows;
  }
}

module.exports = Role;
