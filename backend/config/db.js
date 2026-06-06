// config/db.js
// MySQL connection pool with error handling and reconnection logic

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME || 'iam_db',
  waitForConnections: true,
  connectionLimit:    10,          // Max parallel connections
  queueLimit:         0,           // Unlimited queued requests
  timezone:           '+00:00',    // Always store UTC
  charset:            'utf8mb4',
});

// Test connection on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
