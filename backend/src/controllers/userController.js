/**
 * User & Officer Profile Management Controller
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const bcrypt = require('bcryptjs');
const { db } = require('../config/database');

async function getUsers(req, res) {
  const users = await db('users').select('id', 'name', 'email', 'username', 'role', 'created_at', 'updated_at');
  return res.json({
    success: true,
    data: users,
  });
}

async function updateProfile(req, res) {
  const userId = req.user.id;
  const { name, email, password } = req.body;

  const updateData = {
    updated_at: db.raw('CURRENT_TIMESTAMP'),
  };

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (password && password.trim().length > 0) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await db('users').where('id', userId).update(updateData);

  const updatedUser = await db('users')
    .where('id', userId)
    .select('id', 'name', 'email', 'username', 'role')
    .first();

  return res.json({
    success: true,
    message: 'Profil petugas berhasil diperbarui.',
    user: updatedUser,
  });
}

module.exports = {
  getUsers,
  updateProfile,
};
