import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query('SELECT id, productCode, category, description FROM cabinet_products ORDER BY productCode');
  await fs.writeFile('/home/ubuntu/woodoo_products_source.json', JSON.stringify(rows, null, 2));
  console.log(`Exported ${rows.length} Woodoo products.`);
} finally {
  await connection.end();
}
