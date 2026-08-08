/**
 * Reminders Data Management & Blasting Controller
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const { db } = require('../config/database');
const { addReminderToQueue } = require('../queues/reminderQueue');
const { formatTemplateMessage } = require('../services/schedulerService');
const XLSX = require('xlsx');

function formatPhone62(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

// GET /api/reminders (with Dynamic Filtering)
async function getReminders(req, res) {
  const { search, dueDate, sendDate, status } = req.query;

  let query = db('reminders');

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    query = query.where((builder) => {
      builder
        .where('name', 'like', term)
        .orWhere('phone', 'like', term)
        .orWhere('item', 'like', term)
        .orWhere('no_surat', 'like', term);
    });
  }

  if (dueDate) {
    query = query.andWhere('due_date', dueDate);
  }

  if (sendDate) {
    query = query.andWhere('send_date', sendDate);
  }

  if (status) {
    query = query.andWhere('status', status);
  }

  const reminders = await query.orderBy('id', 'desc');

  return res.json({
    success: true,
    total: reminders.length,
    data: reminders,
  });
}

// GET /api/reminders/:id
async function getReminderById(req, res) {
  const { id } = req.params;
  const reminder = await db('reminders').where('id', id).first();

  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Data pengingat tidak ditemukan.' });
  }

  const messages = await db('messages').where('reminder_id', id).orderBy('id', 'desc');
  const statusLogs = await db('reminders_status').where('reminder_id', id).orderBy('id', 'desc');

  return res.json({
    success: true,
    data: {
      ...reminder,
      messages,
      statusLogs,
    },
  });
}

// POST /api/reminders
async function createReminder(req, res) {
  const { name, phone, item, amount, dueDate, noSurat } = req.body;

  if (!name || !phone || !item || !amount || !dueDate) {
    return res.status(400).json({
      success: false,
      message: 'Mohon isi semua bidang yang wajib (Nama, Phone, Barang, Jumlah, Tanggal).',
    });
  }

  const formattedPhone = formatPhone62(phone);
  const suratNumber = noSurat || `PGD-${Date.now().toString().slice(-6)}`;

  const [id] = await db('reminders').insert({
    no_surat: suratNumber,
    name: name.trim(),
    phone: formattedPhone,
    item: item.trim(),
    amount: Number(amount),
    due_date: dueDate,
    status: 'pending',
  });

  await db('reminders_status').insert({
    reminder_id: id,
    status: 'pending',
    note: 'Pengingat baru berhasil dibuat.',
  });

  const created = await db('reminders').where('id', id).first();

  return res.status(201).json({
    success: true,
    message: 'Pengingat pembayaran berhasil dibuat.',
    data: created,
  });
}

// PUT /api/reminders/:id
async function updateReminder(req, res) {
  const { id } = req.params;
  const { name, phone, item, amount, dueDate, noSurat, status } = req.body;

  const reminder = await db('reminders').where('id', id).first();
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Data pengingat tidak ditemukan.' });
  }

  const updateData = {
    updated_at: db.raw('CURRENT_TIMESTAMP'),
  };

  if (name) updateData.name = name.trim();
  if (phone) updateData.phone = formatPhone62(phone);
  if (item) updateData.item = item.trim();
  if (amount) updateData.amount = Number(amount);
  if (dueDate) updateData.due_date = dueDate;
  if (noSurat) updateData.no_surat = noSurat;
  if (status) updateData.status = status;

  await db('reminders').where('id', id).update(updateData);
  const updated = await db('reminders').where('id', id).first();

  return res.json({
    success: true,
    message: 'Data pengingat berhasil diperbarui.',
    data: updated,
  });
}

// DELETE /api/reminders/:id
async function deleteReminder(req, res) {
  const { id } = req.params;

  const reminder = await db('reminders').where('id', id).first();
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Data pengingat tidak ditemukan.' });
  }

  await db('reminders').where('id', id).del();

  return res.json({
    success: true,
    message: 'Pengingat pembayaran berhasil dihapus.',
  });
}

// POST /api/reminders/:id/resend (Send single message to one phone number)
async function resendSingleReminder(req, res) {
  const { id } = req.params;

  const reminder = await db('reminders').where('id', id).first();
  if (!reminder) {
    return res.status(404).json({ success: false, message: 'Data pengingat tidak ditemukan.' });
  }

  // Fetch active template
  const templateObj = await db('message_templates').where('is_active', true).first();
  const templateText = templateObj ? templateObj.template_body : '';

  const formattedMsg = formatTemplateMessage(templateText, reminder);
  await addReminderToQueue(reminder.id, reminder.phone, formattedMsg);

  return res.json({
    success: true,
    message: `Pesan pengingat WhatsApp berhasil dimasukkan ke antrean kirim untuk ${reminder.name} (${reminder.phone}).`,
    data: reminder,
  });
}

// POST /api/reminders/blast
async function triggerBlast(req, res) {
  const { reminderIds } = req.body;

  let query = db('reminders');
  if (Array.isArray(reminderIds) && reminderIds.length > 0) {
    query = query.whereIn('id', reminderIds);
  } else {
    query = query.where('status', 'pending');
  }

  const targetReminders = await query;
  if (targetReminders.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tidak ada data pengingat berkategori pending yang siap dikirim.',
    });
  }

  // Get active template
  const templateObj = await db('message_templates').where('is_active', true).first();
  const templateText = templateObj ? templateObj.template_body : '';

  let queuedCount = 0;
  for (const item of targetReminders) {
    const formattedMsg = formatTemplateMessage(templateText, item);
    await addReminderToQueue(item.id, item.phone, formattedMsg);
    queuedCount++;
  }

  return res.json({
    success: true,
    message: `Berhasil memasukkan ${queuedCount} pesan pengingat ke antrean WhatsApp Blasting.`,
    queuedCount,
  });
}

// POST /api/reminders/import-excel
async function importExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Mohon unggah file Excel (.xlsx / .xls).' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length <= 1) {
      return res.status(400).json({ success: false, message: 'File Excel kosong atau tidak sesuai format.' });
    }

    let importedCount = 0;

    // Header expected: Nama, Phone, Barang, Jumlah, Tanggal (atau kolom 0..4)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || !row[0]) continue;

      const name = String(row[0] || '').trim();
      const phone = formatPhone62(row[1]);
      const item = String(row[2] || 'Barang Gadai').trim();
      const amount = Number(row[3] || 0);
      let dueDate = row[4];

      // Handle Excel date format
      if (typeof dueDate === 'number') {
        const dateObj = XLSX.SSF.parse_date_code(dueDate);
        dueDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      } else if (dueDate) {
        dueDate = String(dueDate).split('T')[0];
      } else {
        dueDate = new Date().toISOString().split('T')[0];
      }

      const noSurat = row[5] ? String(row[5]) : `PGD-IMP-${Date.now().toString().slice(-5)}${i}`;

      const [id] = await db('reminders').insert({
        no_surat: noSurat,
        name: name,
        phone: phone,
        item: item,
        amount: amount,
        due_date: dueDate,
        status: 'pending',
      });

      await db('reminders_status').insert({
        reminder_id: id,
        status: 'pending',
        note: 'Import dari file Excel.',
      });

      importedCount++;
    }

    return res.json({
      success: true,
      message: `Berhasil mengimpor ${importedCount} data nasabah dari Excel!`,
      importedCount,
    });
  } catch (error) {
    console.error('Error Excel Import:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengimpor file Excel: ' + error.message,
    });
  }
}

// GET /api/reminders/export-excel
async function exportExcel(req, res) {
  const reminders = await db('reminders').orderBy('id', 'desc');

  const exportData = reminders.map((r, index) => ({
    No: index + 1,
    'No Surat Gadai': r.no_surat,
    'Nama Pelanggan': r.name,
    'Nomor Telepon': r.phone,
    'Barang Gadai': r.item,
    'Jumlah Pembayaran': r.amount,
    'Tanggal Jatuh Tempo': r.due_date,
    'Tanggal Kirim': r.send_date || '-',
    'Status Blasting': r.status.toUpperCase(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Blasting');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Pengingat_Pegadaian_BieM363.xlsx');
  return res.send(buffer);
}

// GET /api/reminders/stats
async function getDashboardStats(req, res) {
  const today = new Date().toISOString().split('T')[0];

  const total = await db('reminders').count('id as count').first();
  const pending = await db('reminders').where('status', 'pending').count('id as count').first();
  const queued = await db('reminders').where('status', 'queued').count('id as count').first();
  const sent = await db('reminders').where('status', 'sent').count('id as count').first();
  const failed = await db('reminders').where('status', 'failed').count('id as count').first();
  const dueToday = await db('reminders').where('due_date', today).count('id as count').first();

  return res.json({
    success: true,
    stats: {
      total: total?.count || 0,
      pending: pending?.count || 0,
      queued: queued?.count || 0,
      sent: sent?.count || 0,
      failed: failed?.count || 0,
      dueToday: dueToday?.count || 0,
    },
  });
}

module.exports = {
  getReminders,
  getReminderById,
  createReminder,
  updateReminder,
  deleteReminder,
  resendSingleReminder,
  triggerBlast,
  importExcel,
  exportExcel,
  getDashboardStats,
};
