/**
 * WhatsApp Engine Routes
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

router.get('/status', whatsappController.getStatus);
router.post('/init', whatsappController.initEngine);
router.post('/logout', whatsappController.logoutEngine);

module.exports = router;
