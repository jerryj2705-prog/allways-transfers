import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// New price-component columns to add to the bookings table.
const columns = [
  'distanceCharge',
  'outOfHoursSurcharge',
  'outOfAreaSurcharge',
  'fuelLevySurcharge',
  'petSurcharge',
  'weightSurcharge',
  'cardSurcharge',
  'roundingDiscount',
];

async function run() {
  const conn = await mysql.createConnection(url);
  const dbName = (await conn.query('SELECT DATABASE() AS db'))[0][0].db;
  console.log('Connected to database:', dbName);

  for (const col of columns) {
    // Check if the column already exists (idempotent / safe to re-run).
    const [rows] = await conn.query(
      'SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
      [dbName, 'bookings', col]
    );
    if (rows[0].c > 0) {
      console.log(`SKIP  ${col} (already exists)`);
      continue;
    }
    const sql = `ALTER TABLE bookings ADD COLUMN \`${col}\` DECIMAL(10,2) DEFAULT '0'`;
    await conn.query(sql);
    console.log(`ADDED ${col}`);
  }

  // Show the final set of columns for verification.
  const [cols] = await conn.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?)',
    [dbName, 'bookings', columns]
  );
  console.log('Verified columns present:', cols.map((r) => r.COLUMN_NAME).join(', '));
  await conn.end();
  console.log('Migration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
