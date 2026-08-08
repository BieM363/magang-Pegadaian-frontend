/**
 * Redis Connection Setup with Resilient Handling
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const Redis = require('ioredis');
require('dotenv').config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  connectTimeout: 800, // Quick timeout to prevent blocking server boot
  enableReadyCheck: false,
  retryStrategy(times) {
    if (times > 1) {
      return null; // Stop retrying quickly if Redis is offline
    }
    return 300;
  },
};

let redisConnection = null;
let isRedisAvailable = false;

try {
  redisConnection = new Redis(redisConfig);
  redisConnection.on('connect', () => {
    isRedisAvailable = true;
    console.log('✅ Redis connected successfully for BullMQ processing.');
  });
  redisConnection.on('error', (err) => {
    isRedisAvailable = false;
  });
} catch (err) {
  isRedisAvailable = false;
  console.warn('⚠️ Redis initialization bypassed, using fallback queue mode.');
}

module.exports = {
  redisConnection,
  redisConfig,
  getIsRedisAvailable: () => isRedisAvailable,
};
