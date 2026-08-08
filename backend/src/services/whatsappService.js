/**
 * Localhost WhatsApp Engine Service
 * Powered by whatsapp-web.js + qrcode-terminal + LocalAuth
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const EventEmitter = require('events');
const path = require('path');
require('dotenv').config();

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.status = 'DISCONNECTED'; // DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
    this.qrCodeData = null; // Base64 Data URL for UI
    this.qrCodeRaw = null;  // Raw string for terminal
    this.userPhone = null;
    this.userName = null;
    this.initAttempts = 0;
  }

  findChromePath() {
    const fs = require('fs');
    const possiblePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  initialize() {
    if (this.client) {
      console.log('ℹ️ WhatsApp Client already initialized.');
      return;
    }

    console.log('🚀 Initializing WhatsApp Local Engine (whatsapp-web.js)...');
    this.status = 'INITIALIZING';
    this.emit('status_change', { status: this.status });

    const sessionPath = path.resolve(__dirname, '../../.wwebjs_auth');
    const systemChromePath = this.findChromePath();

    const puppeteerOptions = {
      headless: process.env.PUPPETEER_HEADLESS !== 'false',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    };

    if (systemChromePath) {
      puppeteerOptions.executablePath = systemChromePath;
      console.log(`🌐 Using system browser executable: ${systemChromePath}`);
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'pegadaian_blast_session',
        dataPath: sessionPath,
      }),
      puppeteer: puppeteerOptions,
    });

    // QR Code Event
    this.client.on('qr', async (qr) => {
      this.status = 'QR_READY';
      this.qrCodeRaw = qr;

      console.log('\n======================================================');
      console.log('📲 SCAN QR CODE BELOW WITH YOUR WHATSAPP APP (PEGADAIAN)');
      console.log('======================================================\n');
      qrcodeTerminal.generate(qr, { small: true });

      try {
        this.qrCodeData = await QRCode.toDataURL(qr);
      } catch (err) {
        console.error('Error generating QR Data URL:', err);
      }

      this.emit('qr', { qrRaw: this.qrCodeRaw, qrDataUrl: this.qrCodeData });
      this.emit('status_change', { status: this.status, qrDataUrl: this.qrCodeData });
    });

    // Authenticated Event
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp Client Authenticated Successfully.');
      this.status = 'AUTHENTICATED';
      this.qrCodeData = null;
      this.qrCodeRaw = null;
      this.emit('status_change', { status: this.status });
    });

    // Ready Event
    this.client.on('ready', () => {
      this.status = 'CONNECTED';
      const info = this.client.info;
      this.userPhone = info?.wid?.user || 'Connected User';
      this.userName = info?.pushname || 'Pegadaian Gorontalo Officer';

      console.log('======================================================');
      console.log(`✅ WHATSAPP ENGINE READY! Logged in as: ${this.userName} (${this.userPhone})`);
      console.log('======================================================\n');

      this.emit('ready', { phone: this.userPhone, name: this.userName });
      this.emit('status_change', {
        status: this.status,
        phone: this.userPhone,
        name: this.userName,
      });
    });

    // Disconnected Event
    this.client.on('disconnected', (reason) => {
      console.warn(`⚠️ WhatsApp Client Disconnected: ${reason}`);
      this.status = 'DISCONNECTED';
      this.qrCodeData = null;
      this.client = null;
      this.emit('status_change', { status: this.status, reason });
    });

    // Auth Failure Event
    this.client.on('auth_failure', (msg) => {
      console.error(`❌ WhatsApp Auth Failure: ${msg}`);
      this.status = 'DISCONNECTED';
      this.qrCodeData = null;
      this.client = null;
      this.emit('status_change', { status: this.status, error: msg });
    });

    // Start client catch error
    this.client.initialize().catch((err) => {
      console.error('❌ Failed to initialize WhatsApp Client Puppeteer:', err.message);
      this.status = 'DISCONNECTED';
      this.client = null;
      this.emit('status_change', { status: this.status, error: err.message });
    });
  }

  /**
   * Format Phone Number into standard WhatsApp format (62xxx@c.us)
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = String(phone).replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }

    return `${cleaned}@c.us`;
  }

  /**
   * Send WhatsApp Message Safely
   */
  async sendMessage(phone, messageText) {
    if (this.status !== 'CONNECTED' || !this.client) {
      throw new Error('WhatsApp Engine is not connected. Please scan QR Code first.');
    }

    const chatId = this.formatPhoneNumber(phone);
    if (!chatId) {
      throw new Error(`Invalid phone number provided: ${phone}`);
    }

    console.log(`📤 Sending message via WhatsApp to ${chatId}...`);
    const response = await this.client.sendMessage(chatId, messageText);
    return response;
  }

  getStatus() {
    return {
      status: this.status,
      qrDataUrl: this.qrCodeData,
      qrRaw: this.qrCodeRaw,
      userPhone: this.userPhone,
      userName: this.userName,
    };
  }

  async logout() {
    if (this.client) {
      try {
        await this.client.logout();
      } catch (err) {
        console.error('Error logging out WhatsApp:', err);
      }
      this.client = null;
      this.status = 'DISCONNECTED';
      this.qrCodeData = null;
      this.emit('status_change', { status: this.status });
    }
  }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;
