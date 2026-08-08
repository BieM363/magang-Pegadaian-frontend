/**
 * Dynamic Message Template Controller
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const { db } = require('../config/database');

async function getTemplates(req, res) {
  const templates = await db('message_templates').orderBy('id', 'desc');
  return res.json({
    success: true,
    data: templates,
  });
}

async function getActiveTemplate(req, res) {
  const activeTemplate = await db('message_templates').where('is_active', true).first();
  return res.json({
    success: true,
    data: activeTemplate || null,
  });
}

async function updateTemplate(req, res) {
  const { id } = req.params;
  const { title, templateBody, isActive } = req.body;

  const existing = await db('message_templates').where('id', id).first();
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Template tidak ditemukan.' });
  }

  if (isActive) {
    // Set all other templates is_active to false
    await db('message_templates').update({ is_active: false });
  }

  const updateData = {
    updated_at: db.raw('CURRENT_TIMESTAMP'),
  };

  if (title) updateData.title = title;
  if (templateBody) updateData.template_body = templateBody;
  if (isActive !== undefined) updateData.is_active = Boolean(isActive);

  await db('message_templates').where('id', id).update(updateData);
  const updated = await db('message_templates').where('id', id).first();

  return res.json({
    success: true,
    message: 'Template pesan dinamis berhasil diperbarui.',
    data: updated,
  });
}

async function createTemplate(req, res) {
  const { title, templateBody, isActive } = req.body;

  if (!title || !templateBody) {
    return res.status(400).json({ success: false, message: 'Judul dan isi template wajib diisi!' });
  }

  if (isActive) {
    await db('message_templates').update({ is_active: false });
  }

  const [id] = await db('message_templates').insert({
    title: title.trim(),
    template_body: templateBody,
    is_active: isActive ? true : false,
  });

  const created = await db('message_templates').where('id', id).first();

  return res.status(201).json({
    success: true,
    message: 'Template pesan berhasil dibuat.',
    data: created,
  });
}

module.exports = {
  getTemplates,
  getActiveTemplate,
  updateTemplate,
  createTemplate,
};
