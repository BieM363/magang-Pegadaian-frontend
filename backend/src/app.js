/**
 * Express Application Setup
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('express-async-errors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const templateRoutes = require('./routes/templateRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files if needed
app.use(express.static(path.join(__dirname, '../../')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/templates', templateRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'Web Blast Pesan Pengingat Pembayaran (Upgrade Pegadaian)',
    author: 'BieM363',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('❌ Global Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

module.exports = app;
