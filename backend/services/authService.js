// services/authService.js
// Business logic layer for authentication — keeps controllers thin

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const RefreshToken = require('../models/RefreshToken');
const tokenService = require('./tokenService');

const BCRYPT_ROUNDS = 12;

class AuthService {
  /**
   * Register a new user
   * @returns {{ user, accessToken, refreshToken }}
   */
  async register({ username, email, password, roleName = 'user' }, meta = {}) {
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      const err = new Error('Email is already registered');
      err.status = 409;
      throw err;
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      const err = new Error('Username is already taken');
      err.status = 409;
      throw err;
    }

    const role = await Role.findByName(roleName);
    if (!role) {
      const err = new Error('Invalid role specified');
      err.status = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const userId = await User.create({ username, email, passwordHash, roleId: role.id });

    const user = { id: userId, username, email, role_name: role.name, role_id: role.id };

    const { accessToken, refreshToken } = await this._issueTokens(user, meta);

    return { user: this._sanitize(user), accessToken, refreshToken };
  }

  /**
   * Login with email + password
   * @returns {{ user, accessToken, refreshToken }}
   */
  async login({ email, password }, meta = {}) {
    const user = await User.findByEmail(email);

    const invalidError = new Error('Invalid email or password');
    invalidError.status = 401;

    if (!user) throw invalidError;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) throw invalidError;

    User.updateLastLogin(user.id).catch(() => {});

    const { accessToken, refreshToken } = await this._issueTokens(user, meta);

    return { user: this._sanitize(user), accessToken, refreshToken };
  }

  /**
   * Rotate refresh token: revoke old, issue new pair
   * @returns {{ accessToken, refreshToken }}
   */
  async refreshTokens(oldRefreshToken, meta = {}) {
    let payload;
    try {
      payload = tokenService.verifyRefreshToken(oldRefreshToken);
    } catch {
      const err = new Error('Invalid or expired refresh token');
      err.status = 401;
      throw err;
    }

    const tokenRecord = await RefreshToken.findValid(oldRefreshToken);
    if (!tokenRecord) {
      // Token reuse detected — invalidate all sessions for this user
      await RefreshToken.revokeAllForUser(payload.sub);
      const err = new Error('Refresh token reuse detected — all sessions invalidated');
      err.status = 401;
      throw err;
    }

    const user = await User.findById(payload.sub);
    if (!user || !user.is_active) {
      const err = new Error('User account is inactive');
      err.status = 401;
      throw err;
    }

    await RefreshToken.revoke(oldRefreshToken);

    const { accessToken, refreshToken } = await this._issueTokens(user, meta);

    return { accessToken, refreshToken };
  }

  /**
   * Logout: revoke the refresh token from DB
   */
  async logout(refreshToken) {
    if (!refreshToken) return;
    await RefreshToken.revoke(refreshToken).catch(() => {});
  }

  async _issueTokens(user, meta) {
    const accessToken  = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user.id);

    await RefreshToken.save(
      user.id,
      refreshToken,
      tokenService.getRefreshTokenExpirySeconds(),
      meta
    );

    return { accessToken, refreshToken };
  }

  _sanitize(user) {
    const { password_hash, ...safe } = user;
    return safe;
  }
}

module.exports = new AuthService();
