/**
 * BullMQ Message Queue & Worker Service (Asynchronous Blasting)
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const { Queue, Worker } = require('bullmq');
const { redisConfig, getIsRedisAvailable } = require('../config/redis');
const { db } = require('../config/database');
const whatsappService = require('../services/whatsappService');
require('dotenv').config();

const QUEUE_NAME = 'pegadaian-reminder-queue';
const minDelay = Number(process.env.BLAST_DELAY_MIN_MS || 3000);
const maxDelay = Number(process.env.BLAST_DELAY_MAX_MS || 7000);

function getRandomDelay() {
  return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
}

let reminderQueue = null;
let reminderWorker = null;

// Local Memory Queue Fallback if Redis is not active
const localQueue = [];
let isLocalQueueProcessing = false;

function initQueue() {
  if (getIsRedisAvailable()) {
    try {
      reminderQueue = new Queue(QUEUE_NAME, {
        connection: redisConfig,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      });

      reminderWorker = new Worker(
        QUEUE_NAME,
        async (job) => {
          const { reminderId, messageText, phone } = job.data;
          await processSingleReminder(reminderId, phone, messageText);
        },
        {
          connection: redisConfig,
          concurrency: 1, // Sequential delivery for anti-blocking
        }
      );

      reminderWorker.on('completed', (job) => {
        console.log(`✅ [BullMQ] Job ${job.id} completed for Reminder ID: ${job.data.reminderId}`);
      });

      reminderWorker.on('failed', (job, err) => {
        console.error(`❌ [BullMQ] Job ${job.id} failed for Reminder ID: ${job.data.reminderId}: ${err.message}`);
      });

      console.log('✅ BullMQ Queue & Worker initialized with Redis.');
    } catch (err) {
      console.warn('⚠️ BullMQ setup exception, switching to Local Memory Queue fallback:', err.message);
      reminderQueue = null;
    }
  } else {
    console.log('ℹ️ Redis inactive. Using Built-in Resilient Async Queue Processor.');
  }
}

/**
 * Core function to process a single reminder delivery
 */
async function processSingleReminder(reminderId, phone, messageText) {
  // Anti-block random delay
  const delayMs = getRandomDelay();
  console.log(`⏳ [Anti-Block Delay] Waiting ${delayMs}ms before sending to ${phone}...`);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  try {
    // Attempt sending via WhatsApp Service
    await whatsappService.sendMessage(phone, messageText);

    const now = new Date();

    // 1. Update Reminders Table
    await db('reminders')
      .where('id', reminderId)
      .update({
        status: 'sent',
        send_date: db.raw('CURRENT_DATE'),
        updated_at: db.raw('CURRENT_TIMESTAMP'),
      });

    // 2. Insert Message Log
    await db('messages').insert({
      reminder_id: reminderId,
      message_text: messageText,
      status: 'sent',
      sent_at: now,
      error_message: null,
    });

    // 3. Insert Reminders Status Log
    await db('reminders_status').insert({
      reminder_id: reminderId,
      status: 'sent',
      note: `Pesan pengingat berhasil terkirim ke WhatsApp nasabah (${phone}).`,
    });

    console.log(`🎉 [SUCCESS] Reminder ID #${reminderId} sent to ${phone}`);
    return { success: true };
  } catch (error) {
    console.error(`💥 [FAILED] Reminder ID #${reminderId} error: ${error.message}`);

    // Update DB to Failed status
    await db('reminders')
      .where('id', reminderId)
      .update({
        status: 'failed',
        updated_at: db.raw('CURRENT_TIMESTAMP'),
      });

    await db('messages').insert({
      reminder_id: reminderId,
      message_text: messageText,
      status: 'failed',
      sent_at: null,
      error_message: error.message,
    });

    await db('reminders_status').insert({
      reminder_id: reminderId,
      status: 'failed',
      note: `Gagal mengirim WhatsApp: ${error.message}`,
    });

    throw error;
  }
}

/**
 * Process Local Memory Queue sequentially if Redis is offline
 */
async function processLocalQueue() {
  if (isLocalQueueProcessing || localQueue.length === 0) return;
  isLocalQueueProcessing = true;

  while (localQueue.length > 0) {
    const jobData = localQueue.shift();
    try {
      await processSingleReminder(jobData.reminderId, jobData.phone, jobData.messageText);
    } catch (err) {
      console.error(`[LocalQueue Error] Reminder ID #${jobData.reminderId}:`, err.message);
    }
  }

  isLocalQueueProcessing = false;
}

/**
 * Add single or mass reminders to Queue
 */
async function addReminderToQueue(reminderId, phone, messageText) {
  // Update status to 'queued' first in database
  await db('reminders')
    .where('id', reminderId)
    .update({ status: 'queued', updated_at: db.raw('CURRENT_TIMESTAMP') });

  await db('reminders_status').insert({
    reminder_id: reminderId,
    status: 'queued',
    note: 'Pengingat telah dimasukkan ke dalam antrean (In-Queue).',
  });

  if (reminderQueue && getIsRedisAvailable()) {
    await reminderQueue.add('send-whatsapp-reminder', {
      reminderId,
      phone,
      messageText,
    });
    console.log(`📥 [BullMQ Queued] Reminder ID #${reminderId} added to Redis queue.`);
  } else {
    localQueue.push({ reminderId, phone, messageText });
    console.log(`📥 [Local Queue] Reminder ID #${reminderId} added to local queue.`);
    processLocalQueue();
  }
}

module.exports = {
  initQueue,
  addReminderToQueue,
};
