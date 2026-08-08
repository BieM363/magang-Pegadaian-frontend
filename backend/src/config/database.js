/**
 * Database Configuration & Schema Auto-Migration
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const knex = require('knex');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbClient = process.env.DB_CLIENT || 'sqlite3';

let dbConfig;
if (dbClient === 'sqlite3') {
  const dbPath = path.resolve(__dirname, '../../', process.env.DB_FILENAME || './src/database/pegadaian_blast.sqlite');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  dbConfig = {
    client: 'sqlite3',
    connection: {
      filename: dbPath,
    },
    useNullAsDefault: true,
  };
} else {
  dbConfig = {
    client: dbClient,
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pegadaian_blast',
    },
  };
}

const db = knex(dbConfig);

async function initDatabaseSchema() {
  try {
    // 1. Table Users
    const hasUsers = await db.schema.hasTable('users');
    if (!hasUsers) {
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').unique().notNullable();
        table.string('username').unique().notNullable();
        table.string('password').notNullable();
        table.string('role').defaultTo('admin');
        table.timestamps(true, true);
      });
      console.log('✅ Table [users] created successfully.');

      // Default Admin Account (admin123 / 08 or admin123 / admin123)
      const hashedPassword = await bcrypt.hash('08', 10);
      await db('users').insert({
        name: 'Petugas Admin Pegadaian',
        email: 'admin.gorontalo@pegadaian.co.id',
        username: 'admin123',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('👤 Default Admin Created: username [admin123], password [08]');
    }

    // 2. Table Reminders
    const hasReminders = await db.schema.hasTable('reminders');
    if (!hasReminders) {
      await db.schema.createTable('reminders', (table) => {
        table.increments('id').primary();
        table.string('no_surat').notNullable();
        table.string('name').notNullable();
        table.string('phone').notNullable();
        table.string('item').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.date('due_date').notNullable();
        table.date('send_date').nullable();
        table.enum('status', ['pending', 'queued', 'sent', 'failed']).defaultTo('pending');
        table.timestamps(true, true);
      });
      console.log('✅ Table [reminders] created successfully.');
    }

    // 3. Table Messages
    const hasMessages = await db.schema.hasTable('messages');
    if (!hasMessages) {
      await db.schema.createTable('messages', (table) => {
        table.increments('id').primary();
        table.integer('reminder_id').unsigned().references('id').inTable('reminders').onDelete('CASCADE');
        table.text('message_text').notNullable();
        table.string('status').defaultTo('pending');
        table.datetime('sent_at').nullable();
        table.text('error_message').nullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Table [messages] created successfully.');
    }

    // 4. Table Reminders Status Log
    const hasRemindersStatus = await db.schema.hasTable('reminders_status');
    if (!hasRemindersStatus) {
      await db.schema.createTable('reminders_status', (table) => {
        table.increments('id').primary();
        table.integer('reminder_id').unsigned().references('id').inTable('reminders').onDelete('CASCADE');
        table.string('status').notNullable();
        table.timestamp('log_time').defaultTo(db.fn.now());
        table.text('note').nullable();
      });
      console.log('✅ Table [reminders_status] created successfully.');
    }

    // 5. Table Personal Access Tokens
    const hasTokens = await db.schema.hasTable('personal_access_tokens');
    if (!hasTokens) {
      await db.schema.createTable('personal_access_tokens', (table) => {
        table.increments('id').primary();
        table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        table.text('token').notNullable();
        table.datetime('expires_at').notNullable();
        table.timestamp('created_at').defaultTo(db.fn.now());
      });
      console.log('✅ Table [personal_access_tokens] created successfully.');
    }

    // 6. Table Message Templates
    const hasTemplates = await db.schema.hasTable('message_templates');
    if (!hasTemplates) {
      await db.schema.createTable('message_templates', (table) => {
        table.increments('id').primary();
        table.string('title').notNullable();
        table.text('template_body').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('✅ Table [message_templates] created successfully.');

      // Default Template Pegadaian
      await db('message_templates').insert({
        title: 'Template Pengingat Pembayaran Utama',
        template_body: `Yth. Bapak/Ibu *nama*,
Pengingat dari *Pegadaian Gorontalo Sentral*.
No. Surat Gadai: *nosurat*
Barang Gadai: *barang*
Jumlah Pelunasan/Sewa: Rp *harga*
Tanggal Jatuh Tempo: *tanggal*

Mohon melakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih.
_Mengatasi Masalah Tanpa Masalah_`,
        is_active: true,
      });
      console.log('📝 Default Message Template Created.');
    }
  } catch (error) {
    console.error('❌ Error initializing Database Schema:', error);
  }
}

module.exports = { db, initDatabaseSchema };
