/**
 * Authentication Controller (JWT & Personal Access Tokens)
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'PegadaianGorontaloSentralSecretKey2026_BieM363';

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan password wajib diisi!',
    });
  }

  // Find user by username or email
  const user = await db('users')
    .where('username', username)
    .orWhere('email', username)
    .first();

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Username atau password tidak ditemukan.',
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Username atau password salah.',
    });
  }

  // Generate JWT Token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Store in personal_access_tokens table
  await db('personal_access_tokens').insert({
    user_id: user.id,
    token: token,
    expires_at: expiresAt,
  });

  return res.json({
    success: true,
    message: 'Login berhasil!',
    token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
    },
  });
}

async function getMe(req, res) {
  return res.json({
    success: true,
    user: req.user,
  });
}

async function logout(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    await db('personal_access_tokens').where('token', token).del();
  }

  return res.json({
    success: true,
    message: 'Berhasil keluar dari sistem.',
  });
}

module.exports = {
  login,
  getMe,
  logout,
};
