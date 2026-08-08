/**
 * Message Template Routes
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

router.get('/', templateController.getTemplates);
router.get('/active', templateController.getActiveTemplate);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);

module.exports = router;
