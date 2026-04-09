import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const [existing] = await conn.execute(
  `SELECT id FROM pricing_settings WHERE settingKey = 'surcharge_additional_stop'`
);

if (existing.length === 0) {
  await conn.execute(
    `INSERT INTO pricing_settings (settingKey, settingValue, label, description, category, isActive)
     VALUES ('surcharge_additional_stop', 15.00, 'Additional Stop Surcharge', 'Surcharge per additional pickup or drop-off point', 'surcharge', 1)`
  );
  console.log("Inserted surcharge_additional_stop = $15.00");
} else {
  console.log("surcharge_additional_stop already exists, skipping");
}

await conn.end();
