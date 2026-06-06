// models/RefreshToken.js
// Data access layer for refresh_tokens table

const { pool } = require('../config/db');
const crypto = require('crypto');

class RefreshToken {
  /**
   * Hash a raw token before storing or comparing
   * (SHA-256 for fast lookup)
   */
  static hash(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Save a new refresh token
   */
  static async save(userId, rawToken, expiresInSeconds, meta = {}) {
    const tokenHash = this.hash(rawToken);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const { ipAddress, userAgent } = meta;

    await pool.execute(
      `INSERT INTO refresh_tokens 
        (user_id, token, expires_at, ip_address, user_agent, is_revoked)
       VALUES (?, ?, ?, ?, ?, FALSE)`,
      [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null]
    );
  }

  /**
   * Find a valid (not expired, not revoked) token
   */
  static async findValid(rawToken) {
    const tokenHash = this.hash(rawToken);

    const [rows] = await pool.execute(
      `SELECT * FROM refresh_tokens
       WHERE token = ?
         AND is_revoked = FALSE
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    return rows[0] || null;
  }

  /**
   * Revoke a specific token
   */
  static async revoke(rawToken) {
    const tokenHash = this.hash(rawToken);

    const [result] = await pool.execute(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE 
       WHERE token = ?`,
      [tokenHash]
    );

    return result.affectedRows > 0;
  }

  /**
   * Revoke all tokens for a user
   */
  static async revokeAllForUser(userId) {
    await pool.execute(
      `UPDATE refresh_tokens 
       SET is_revoked = TRUE 
       WHERE user_id = ?`,
      [userId]
    );
  }

  /**
   * Cleanup expired or revoked tokens (optional cron job)
   */
  static async cleanup() {
    const [result] = await pool.execute(
      `DELETE FROM refresh_tokens 
       WHERE is_revoked = TRUE 
          OR expires_at <= NOW()`
    );

    return result.affectedRows;
  }
}

module.exports = RefreshToken;