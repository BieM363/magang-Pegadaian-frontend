/**
 * Automated Task Scheduler Service (Node-Cron Harian)
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const cron = require('node-cron');
const { db } = require('../config/database');
const { addReminderToQueue } = require('../queues/reminderQueue');

function formatTemplateMessage(templateBody, data) {
  let text = templateBody || '';
  const formattedAmount = Number(data.amount || 0).toLocaleString('id-ID');
  const formattedDate = data.due_date ? String(data.due_date).split('T')[0] : '-';

  text = text.replace(/\*nama\*/gi, data.name || '');
  text = text.replace(/\*nosurat\*/gi, data.no_surat || '');
  text = text.replace(/\*barang\*/gi, data.item || '');
  text = text.replace(/\*harga\*/gi, formattedAmount);
  text = text.replace(/\*tanggal\*/gi, formattedDate);

  return text;
}

function initScheduler() {
  // Cron schedule: Run every day at 08:00 AM (0 8 * * *)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [Cron Job] Running daily due-date scanner for Pegadaian reminders...');
    try {
      await scanAndQueueDueReminders();
    } catch (err) {
      console.error('❌ [Cron Job Error]:', err.message);
    }
  });

  console.log('⏰ Automated Cron Job Scheduler active (Everyday at 08:00 AM).');
}

async function scanAndQueueDueReminders() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Get active message template
  const templateObj = await db('message_templates').where('is_active', true).first();
  const defaultTemplate = templateObj
    ? templateObj.template_body
    : `Yth. Bapak/Ibu *nama*, pengingat pembayaran gadai *barang* sebesar Rp *harga* jatuh tempo pada *tanggal*. Terima kasih.`;

  // 2. Fetch pending reminders due today or overdue
  const dueReminders = await db('reminders')
    .where('due_date', '<=', today)
    .andWhere('status', 'pending');

  console.log(`📋 [Cron Job Scan] Found ${dueReminders.length} pending reminders due on/before ${today}.`);

  for (const reminder of dueReminders) {
    const formattedMessage = formatTemplateMessage(defaultTemplate, reminder);
    await addReminderToQueue(reminder.id, reminder.phone, formattedMessage);
  }

  return dueReminders.length;
}

module.exports = {
  initScheduler,
  scanAndQueueDueReminders,
  formatTemplateMessage,
};
