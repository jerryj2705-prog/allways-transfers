import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const statements = [
  "ALTER TABLE `bookings` ADD `petDescription` text",
];

async function run() {
  const conn = await mysql.createConnection(url);
  for (const sql of statements) {
    try {
      await conn.execute(sql);
      console.log('OK:', sql.substring(0, 60) + '...');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('SKIP (already exists):', sql.substring(0, 60) + '...');
      } else {
        throw e;
      }
    }
  }
  await conn.end();
  console.log('Migration complete!');
}

run().catch(e => { console.error(e); process.exit(1); });
