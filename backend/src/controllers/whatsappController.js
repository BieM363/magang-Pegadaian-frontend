/**
 * Local WhatsApp Engine Controller
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const whatsappService = require('../services/whatsappService');

async function getStatus(req, res) {
  const statusInfo = whatsappService.getStatus();
  return res.json({
    success: true,
    ...statusInfo,
  });
}

async function initEngine(req, res) {
  whatsappService.initialize();
  const statusInfo = whatsappService.getStatus();
  return res.json({
    success: true,
    message: 'WhatsApp Engine initialization triggered.',
    ...statusInfo,
  });
}

async function logoutEngine(req, res) {
  await whatsappService.logout();
  return res.json({
    success: true,
    message: 'WhatsApp session logged out successfully.',
  });
}

module.exports = {
  getStatus,
  initEngine,
  logoutEngine,
};
