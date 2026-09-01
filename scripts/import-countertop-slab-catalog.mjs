import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const catalogPath = "/home/ubuntu/woodoo_cabinet_order_app/data/countertop-slab-catalog.json";
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [[takeoffCount]] = await connection.execute("SELECT COUNT(*) AS count FROM countertop_takeoffs");
  if (Number(takeoffCount.count) === 0) await connection.execute("DELETE FROM countertop_slabs");
  await connection.execute(
    `INSERT INTO countertop_labor_rates
      (label, materialCentsPerSquareFoot, nonEasedEdgeCentsPerLinearFoot, sinkCutoutCentsEach, vanitySinkCutoutCentsEach, isActive)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       materialCentsPerSquareFoot = VALUES(materialCentsPerSquareFoot),
       nonEasedEdgeCentsPerLinearFoot = VALUES(nonEasedEdgeCentsPerLinearFoot),
       sinkCutoutCentsEach = VALUES(sinkCutoutCentsEach),
       vanitySinkCutoutCentsEach = VALUES(vanitySinkCutoutCentsEach),
       isActive = VALUES(isActive)`,
    ["Standard countertop labor", 3500, 500, 10000, 10000, true],
  );

  const chunks = Array.from({ length: Math.ceil(catalog.length / 75) }, (_, index) => catalog.slice(index * 75, index * 75 + 75));
  for (const chunk of chunks) {
    const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = chunk.flatMap(item => [
      item.supplier,
      item.collection,
      item.materialName,
      item.finish,
      item.thicknessMm,
      item.sourceItemId,
      item.imageUrl,
      item.supplierMaterialUrl,
      item.imageFallbackLabel,
      item.sourcePriceCents,
      item.sourcePriceBasis,
      item.sourceDocument,
      item.discontinued,
    ]);
    await connection.execute(
      `INSERT INTO countertop_slabs
        (supplier, collection, materialName, finish, thicknessMm, sourceItemId, imageUrl, supplierMaterialUrl, imageFallbackLabel, sourcePriceCents, sourcePriceBasis, sourceDocument, discontinued)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         sourceItemId = VALUES(sourceItemId),
         imageUrl = VALUES(imageUrl),
         supplierMaterialUrl = VALUES(supplierMaterialUrl),
         imageFallbackLabel = VALUES(imageFallbackLabel),
         sourcePriceCents = VALUES(sourcePriceCents),
         sourcePriceBasis = VALUES(sourcePriceBasis),
         sourceDocument = VALUES(sourceDocument),
         discontinued = VALUES(discontinued)`,
      values,
    );
  }

  const [counts] = await connection.execute("SELECT supplier, COUNT(*) AS slabCount FROM countertop_slabs GROUP BY supplier ORDER BY supplier");
  const [rates] = await connection.execute("SELECT label, materialCentsPerSquareFoot, nonEasedEdgeCentsPerLinearFoot, sinkCutoutCentsEach, vanitySinkCutoutCentsEach FROM countertop_labor_rates WHERE isActive = true");
  console.log(JSON.stringify({ importedSlabs: catalog.length, counts, activeRates: rates }, null, 2));
} finally {
  await connection.end();
}

process.exit(0);
