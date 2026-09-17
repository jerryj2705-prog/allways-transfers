import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Full serviceType enum after adding Sunshine Coast Airport Transfer.
const SERVICE_ENUM =
  "ENUM('airport_transfer','sunshine_coast_airport_transfer','hourly_hire','point_to_point','special_events','freight')";

// Tables that carry a serviceType enum column (see drizzle/schema.ts).
const enumTables = ['bookings', 'reviews'];

// New pricing_settings rows for the Sunshine Coast service.
// Idempotent: ON DUPLICATE KEY UPDATE leaves existing values untouched.
const newSettings = [
  {
    settingKey: 'base_sunshine_coast_airport_transfer',
    settingValue: '60.00',
    label: 'Sunshine Coast Airport Transfer – Base Price',
    description: 'Starting price for Sunshine Coast Airport transfer service',
    category: 'base_price',
  },
  {
    settingKey: 'starting_price_sunshine_coast',
    settingValue: '50.00',
    label: "Home Page - Sunshine Coast Airport Transfer 'From' Price",
    description: 'Display price on home page service cards for Sunshine Coast Airport',
    category: 'base_price',
  },
];

// Relabel the existing Brisbane airport settings for consistency with the new naming.
const relabels = [
  { settingKey: 'base_airport_transfer', label: 'Brisbane Airport Transfer – Base Price' },
  { settingKey: 'starting_price_airport', label: "Home Page - Brisbane Airport Transfer 'From' Price" },
];

async function run() {
  const conn = await mysql.createConnection(url);
  const dbName = (await conn.query('SELECT DATABASE() AS db'))[0][0].db;
  console.log('Connected to database:', dbName);

  // 1. Expand the serviceType enum on each relevant table.
  for (const table of enumTables) {
    const [exists] = await conn.query(
      'SELECT COUNT(*) AS c FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [dbName, table]
    );
    if (exists[0].c === 0) {
      console.log(`SKIP  table ${table} (does not exist)`);
      continue;
    }
    const sql = `ALTER TABLE \`${table}\` MODIFY \`serviceType\` ${SERVICE_ENUM} NOT NULL`;
    await conn.query(sql);
    console.log(`ALTERED ${table}.serviceType enum`);
  }

  // 2. Insert the new pricing settings (idempotent).
  for (const s of newSettings) {
    await conn.query(
      `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE settingValue = settingValue`,
      [s.settingKey, s.settingValue, s.label, s.description, s.category]
    );
    console.log(`UPSERT pricing_settings ${s.settingKey}`);
  }

  // 3. Relabel existing Brisbane airport settings (only if present).
  for (const r of relabels) {
    const [res] = await conn.query(
      'UPDATE pricing_settings SET label = ? WHERE settingKey = ?',
      [r.label, r.settingKey]
    );
    console.log(`RELABEL ${r.settingKey} -> "${r.label}" (rows affected: ${res.affectedRows})`);
  }

  // Verification.
  const [settings] = await conn.query(
    "SELECT settingKey, settingValue, label FROM pricing_settings WHERE settingKey IN ('base_sunshine_coast_airport_transfer','starting_price_sunshine_coast','base_airport_transfer','starting_price_airport')"
  );
  console.log('Verified pricing settings:');
  for (const row of settings) console.log(`  ${row.settingKey} = ${row.settingValue} (${row.label})`);

  await conn.end();
  console.log('Migration complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
