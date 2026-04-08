import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const vehicles = [
  {
    name: 'Luxury SUV',
    type: 'suv',
    description: 'Premium luxury SUV — seats up to 5 passengers with standard check-in luggage and personal belongings, or up to 7 passengers with very limited check-in luggage and standard personal belongings.',
    capacity: 7,
    luggageCapacity: 5,
    baseRate: '65.00',
    perKmRate: '3.50',
    perHourRate: '95.00',
    imageUrl: null,
    isActive: 1,
  },
  {
    name: 'Support Van',
    type: 'van',
    description: 'Additional support vehicle for large, oversized luggage and freight services. Charged separately as an add-on to your SUV booking.',
    capacity: 0,
    luggageCapacity: 15,
    baseRate: '50.00',
    perKmRate: '2.50',
    perHourRate: '70.00',
    imageUrl: null,
    isActive: 1,
  },
];

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM vehicles');
  if (rows[0].count > 0) {
    console.log('Vehicles already seeded, skipping...');
    await connection.end();
    return;
  }

  for (const v of vehicles) {
    await connection.execute(
      `INSERT INTO vehicles (name, type, description, capacity, luggageCapacity, baseRate, perKmRate, perHourRate, imageUrl, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.name, v.type, v.description, v.capacity, v.luggageCapacity, v.baseRate, v.perKmRate, v.perHourRate, v.imageUrl, v.isActive]
    );
    console.log(`Seeded: ${v.name}`);
  }

  console.log('All vehicles seeded successfully!');
  await connection.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
