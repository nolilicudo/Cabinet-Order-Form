import fs from 'node:fs/promises';
import mysql from 'mysql2/promise';

const seedPath = new URL('./uscd_seed_data.json', import.meta.url);
const seed = JSON.parse(await fs.readFile(seedPath, 'utf8'));

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required to import U.S. Cabinet Depot catalog data.');

const connection = await mysql.createConnection(process.env.DATABASE_URL);

function orderSku(baseSku, skuPrefix) {
  return baseSku.startsWith('SW-') ? `${skuPrefix}-${baseSku.slice(3)}` : baseSku;
}

function placeholders(rowCount, columnCount) {
  return Array.from({ length: rowCount }, () => `(${Array(columnCount).fill('?').join(',')})`).join(',');
}

async function insertBatched(sqlPrefix, rows, columnCount, updateClause, batchSize = 400) {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    await connection.execute(`${sqlPrefix} VALUES ${placeholders(batch.length, columnCount)} ${updateClause}`, batch.flat());
  }
}

try {
  await connection.beginTransaction();

  await insertBatched(
    'INSERT INTO uscd_finishes (finishName, skuPrefix, tierFactorMicros, transferRequired, discontinued, sourceUrl)',
    seed.finishes.map(finish => [finish.finishName, finish.skuPrefix, finish.tierFactorMicros, finish.transferRequired, finish.discontinued, finish.sourceUrl]),
    6,
    'ON DUPLICATE KEY UPDATE skuPrefix = VALUES(skuPrefix), tierFactorMicros = VALUES(tierFactorMicros), transferRequired = VALUES(transferRequired), discontinued = VALUES(discontinued), sourceUrl = VALUES(sourceUrl)',
  );

  await insertBatched(
    'INSERT INTO uscd_products (sourceRow, baseSku, productGroup, description, sourceVersion)',
    seed.products.map(product => [product.sourceRow, product.baseSku, product.productGroup, product.description, product.sourceVersion]),
    5,
    'ON DUPLICATE KEY UPDATE sourceRow = VALUES(sourceRow), productGroup = VALUES(productGroup), description = VALUES(description), sourceVersion = VALUES(sourceVersion)',
  );

  const [finishRows] = await connection.query('SELECT id, finishName, skuPrefix FROM uscd_finishes');
  const [productRows] = await connection.query('SELECT id, baseSku FROM uscd_products');
  const finishesByName = new Map(finishRows.map(row => [row.finishName, row]));
  const productsBySku = new Map(productRows.map(row => [row.baseSku, row.id]));

  const priceRows = [];
  for (const product of seed.products) {
    const productId = productsBySku.get(product.baseSku);
    if (!productId) throw new Error(`Could not resolve U.S. Cabinet Depot product ${product.baseSku}.`);
    for (const [finishName, unitPriceCents] of Object.entries(product.prices)) {
      const finish = finishesByName.get(finishName);
      if (!finish) throw new Error(`Missing U.S. Cabinet Depot finish ${finishName}.`);
      priceRows.push([productId, finish.id, orderSku(product.baseSku, finish.skuPrefix), unitPriceCents, finishName === 'Shaker White' ? 'Direct' : 'Planning']);
    }
  }

  await insertBatched(
    'INSERT INTO uscd_prices (productId, finishId, orderSku, unitPriceCents, priceType)',
    priceRows,
    5,
    'ON DUPLICATE KEY UPDATE orderSku = VALUES(orderSku), unitPriceCents = VALUES(unitPriceCents), priceType = VALUES(priceType)',
  );

  await connection.commit();
  console.log(`Imported ${seed.products.length} U.S. Cabinet Depot products, ${seed.finishes.length} finishes, and ${priceRows.length} source prices.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
