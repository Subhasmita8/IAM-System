// services/tokenService.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET   = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES_IN  || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

function parseDurationToSeconds(str) {
  const units = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
  const match  = String(str).match(/^(\d+)([smhdw])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  return parseInt(match[1]) * units[match[2]];
}

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, email: user.email, role: user.role_name },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES, algorithm: 'HS256' }
  );
}

function generateRefreshToken(userId) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES, algorithm: 'HS256' });
}

function verifyAccessToken(token)  { return jwt.verify(token, ACCESS_SECRET); }
function verifyRefreshToken(token) { return jwt.verify(token, REFRESH_SECRET); }
function getRefreshTokenExpirySeconds() { return parseDurationToSeconds(REFRESH_EXPIRES); }

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, getRefreshTokenExpirySeconds, REFRESH_EXPIRES };
