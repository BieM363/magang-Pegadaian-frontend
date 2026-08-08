/**
 * JWT Authentication & Access Token Middleware
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'PegadaianGorontaloSentralSecretKey2026_BieM363';

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify token exists in personal_access_tokens
    const tokenRecord = await db('personal_access_tokens')
      .where({ user_id: decoded.id, token: token })
      .first();

    if (!tokenRecord) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah keluar.',
      });
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Token telah kadaluarsa. Silakan login kembali.',
      });
    }

    const user = await db('users').where('id', decoded.id).first();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token otentikasi tidak valid atau telah kadaluarsa.',
      error: error.message,
    });
  }
}

module.exports = { authenticateToken };
