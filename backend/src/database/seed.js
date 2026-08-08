/**
 * Database Seed File
 * Author: BieM363 - Upgrade Pegadaian Gorontalo Sentral
 */

const { db, initDatabaseSchema } = require('../config/database');

async function runSeed() {
  await initDatabaseSchema();

  console.log('🌱 Seeding initial sample data for Pegadaian Gorontalo Sentral...');

  const sampleReminders = [
    {
      no_surat: 'PGD-GT-20260801',
      name: 'Rahmat Ismail',
      phone: '6281234567890',
      item: 'Emas Batangan 10 gram',
      amount: 4500000,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
    },
    {
      no_surat: 'PGD-GT-20260802',
      name: 'Siti Rahmawati',
      phone: '6285298765432',
      item: 'Cincin Emas 22 Karat',
      amount: 1750000,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending',
    },
    {
      no_surat: 'PGD-GT-20260803',
      name: 'Budi Santoso',
      phone: '6281399887766',
      item: 'Laptop Asus ROG Strix',
      amount: 8200000,
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'pending',
    },
    {
      no_surat: 'PGD-GT-20260804',
      name: 'Mohammad Ali',
      phone: '6282111223344',
      item: 'Kalung Emas Putih',
      amount: 3100000,
      due_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      status: 'pending',
    },
  ];

  for (const item of sampleReminders) {
    const existing = await db('reminders').where('no_surat', item.no_surat).first();
    if (!existing) {
      const [id] = await db('reminders').insert(item);
      await db('reminders_status').insert({
        reminder_id: id,
        status: 'pending',
        note: 'Sample data seeded.',
      });
    }
  }

  console.log('✅ Sample data seeded successfully!');
  process.exit(0);
}

runSeed();
