/**
 * Reminders Routes
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authenticateToken } = require('../middleware/authMiddleware');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/', reminderController.getReminders);
router.get('/stats', reminderController.getDashboardStats);
router.get('/export-excel', reminderController.exportExcel);
router.get('/:id', reminderController.getReminderById);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);

router.post('/blast', reminderController.triggerBlast);
router.post('/import-excel', upload.single('file'), reminderController.importExcel);

module.exports = router;
