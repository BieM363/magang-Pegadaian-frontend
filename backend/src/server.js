/**
 * Backend Server Entrypoint
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

require('dotenv').config();
const app = require('./app');
const { initDatabaseSchema } = require('./config/database');
const { initQueue } = require('./queues/reminderQueue');
const { initScheduler } = require('./services/schedulerService');
const whatsappService = require('./services/whatsappService');

const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log('------------------------------------------------------');
  console.log('🚀 Starting Pegadaian Web Blast Pesan Pengingat Backend...');
  console.log('👨‍💻 Developed & Upgraded by: BieM363');
  console.log('------------------------------------------------------');

  // 1. Initialize Database Schema & Default Seed Data
  await initDatabaseSchema();

  // 2. Initialize Queue Processor (BullMQ / Local Fallback)
  initQueue();

  // 3. Initialize Task Scheduler (Node-Cron)
  initScheduler();

  // 4. Initialize Local WhatsApp Engine (non-blocking)
  setTimeout(() => {
    try {
      whatsappService.initialize();
    } catch (err) {
      console.warn('⚠️ WhatsApp engine auto-init postponed:', err.message);
    }
  }, 1000);

  // 5. Start Express Listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ RESTful API Server running at: http://localhost:${PORT}`);
    console.log(`📌 Healthcheck Endpoint: http://localhost:${PORT}/api/health`);
    console.log('------------------------------------------------------\n');
  });
}

startServer();
