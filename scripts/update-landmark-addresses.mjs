/**
 * Update landmarks table with official addresses from research results.
 * Run with: node scripts/update-landmark-addresses.mjs
 */

import mysql from "mysql2/promise";
import { readFileSync } from "fs";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const url = new URL(dbUrl);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: true },
  });

  // Read the JSON results
  const data = JSON.parse(readFileSync("/home/ubuntu/lookup_landmark_addresses.json", "utf-8"));
  
  let updated = 0;
  let skipped = 0;

  for (const item of data.results) {
    if (item.error || !item.output || !item.output.address) {
      console.log(`Skipping: ${item.input} (no address found)`);
      skipped++;
      continue;
    }

    const name = item.output.landmark_name || item.input;
    const address = item.output.address;

    const [result] = await connection.query(
      "UPDATE landmarks SET address = ? WHERE name = ?",
      [address, name]
    );

    if (result.affectedRows > 0) {
      updated++;
    } else {
      console.log(`No match in DB for: ${name}`);
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);

  // Verify
  const [rows] = await connection.query("SELECT COUNT(*) as cnt FROM landmarks WHERE address IS NOT NULL AND address != ''");
  console.log(`Landmarks with addresses: ${rows[0].cnt}`);

  await connection.end();
}

main().catch(err => {
  console.error("Update failed:", err);
  process.exit(1);
});
