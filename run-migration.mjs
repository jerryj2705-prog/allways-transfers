import mysql from 'mysql2/promise';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const statements = [
  `CREATE TABLE IF NOT EXISTS enquiries (
    id int AUTO_INCREMENT NOT NULL,
    name varchar(200) NOT NULL,
    email varchar(320) NOT NULL,
    phone varchar(30),
    subject varchar(300) NOT NULL,
    message text NOT NULL,
    status enum('new','read','replied','archived') NOT NULL DEFAULT 'new',
    adminNotes text,
    createdAt timestamp NOT NULL DEFAULT (now()),
    updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT enquiries_id PRIMARY KEY(id)
  )`,
];

async function run() {
  const conn = await mysql.createConnection(url);
  for (const sql of statements) {
    try {
      await conn.execute(sql);
      console.log('OK:', sql.substring(0, 60) + '...');
    } catch (e) {
      if (e.code === 'ER_TABLE_EXISTS_ERROR') {
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
