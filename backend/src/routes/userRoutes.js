/**
 * User & Profile Routes
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, userController.getUsers);
router.put('/profile', authenticateToken, userController.updateProfile);

module.exports = router;
