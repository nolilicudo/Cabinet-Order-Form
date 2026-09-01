import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const sourceDir = "/home/ubuntu/countertop-imports";
const outputPath = "/home/ubuntu/woodoo_cabinet_order_app/data/countertop-slab-catalog.json";

const toCents = (value) => {
  const normalized = String(value).replace(/[$ ]/g, "");
  if (/^\d{1,3}[,.]\d{3}$/.test(normalized)) return Number(normalized.replace(/[,.]/g, "")) * 100;
  return Math.round(Number(normalized.replace(/,/g, "")) * 100);
};
const title = (value) => value.toLowerCase().replace(/(^|[\s/-])([a-zà-ÿ])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
const cleanName = (value) => title(value.replace(/^NEW\s+/i, "").replace(/\(Discontinued\)/ig, "").replace(/\*/g, "").replace(/\s+/g, " ").trim());
const slugify = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const withImageReference = (entry) => {
  const slug = slugify(entry.materialName);
  if (entry.supplier === "MSI") {
    const isQuartz = entry.collection.startsWith("Quartz");
    const stoneType = entry.collection.split(" · ")[1]?.toLowerCase() ?? "granite";
    return {
      ...entry,
      imageUrl: isQuartz
        ? `https://cdn.msisurfaces.com/images/quartz-countertops/products/roomscenes/medium/${slug}-quartz-vignette-2.jpg`
        : `https://cdn.msisurfaces.com/images/colornames/videos/${slug}-${stoneType}.jpg`,
      supplierMaterialUrl: isQuartz
        ? `https://www.msisurfaces.com/quartz-countertops/${slug}-quartz/`
        : `https://www.msisurfaces.com/${stoneType}/${slug}/`,
      imageFallbackLabel: "Official MSI image unavailable — supplier reference shown",
    };
  }
  const collection = entry.collection.split(" · ")[0].toLowerCase().replace(/ē/g, "e");
  return {
    ...entry,
    imageUrl: null,
    supplierMaterialUrl: `https://www.cosentino.com/usa/colors/${collection}/${slug}/`,
    imageFallbackLabel: "Official Cosentino image not linked — supplier reference shown",
  };
};
const addUnique = (items, record) => {
  const key = [record.supplier, record.collection, record.materialName, record.finish, record.thicknessMm ?? "", record.sourceItemId ?? ""].join("|");
  if (!items.some(item => [item.supplier, item.collection, item.materialName, item.finish, item.thicknessMm ?? "", item.sourceItemId ?? ""].join("|") === key)) items.push(record);
};
const record = (partial) => withImageReference({ discontinued: false, sourceItemId: null, thicknessMm: null, ...partial });

function parseMsiNatural(text, items) {
  let collection = "";
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const collectionMatch = line.match(/^(GRANITE|QUARTZITE|SOAPSTONE|MARBLE)(?:\s|$)/);
    if (collectionMatch) { collection = collectionMatch[1]; continue; }
    const match = line.match(/^(.+?)\s{2,}([A-Z/]+)\s{2,}([A-Z]+)\s+(RSL-[A-Z0-9-]+)\s+\$?([\d.]+)\s+\$?([\d.]+)$/);
    if (!match || !collection) continue;
    const [, rawName, finish, , sourceItemId, , loosePrice] = match;
    addUnique(items, record({ supplier: "MSI", collection: `Natural Stone · ${title(collection)}`, materialName: cleanName(rawName), finish: title(finish.replace("/", " / ")), thicknessMm: /2CM/i.test(sourceItemId) ? 20 : 30, sourceItemId, sourcePriceCents: toCents(loosePrice), sourcePriceBasis: "3cm loose supplier price", discontinued: /discontinued/i.test(rawName), sourceDocument: "MSI Natural Stone Price List · Oct 2025" }));
  }
}

function parseMsiQuartz(text, items) {
  let group = "";
  let currentPriceCents = 0;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const groupMatch = line.match(/^(Group\d+)\s+\(/i);
    if (groupMatch) { group = groupMatch[1]; currentPriceCents = 0; continue; }
    if (/^Q Plus\s+\(/i.test(line)) { group = "Q Plus"; currentPriceCents = 0; continue; }
    const itemIndex = line.search(/(?:P-)?QSL-[A-Z0-9-]+/);
    if (itemIndex < 0 || !group) continue;
    const rawName = line.slice(0, itemIndex).trim();
    if (!rawName || /^Color$/i.test(rawName)) continue;
    const sourceItemId = line.slice(itemIndex).match(/(?:P-)?QSL-[A-Z0-9-]+/)?.[0] ?? null;
    const prices = [...line.matchAll(/\$([\d.]+)/g)].map(match => toCents(match[1]));
    if (prices.length) currentPriceCents = prices.at(-1);
    if (!currentPriceCents) continue;
    addUnique(items, record({ supplier: "MSI", collection: `Quartz · ${group}`, materialName: cleanName(rawName), finish: /MATTE|CONCRETE/i.test(rawName) ? "Matte" : /BRUSHED/i.test(rawName) ? "Brushed" : "Polished", thicknessMm: sourceItemId && /-3CM/i.test(sourceItemId) ? 30 : 20, sourceItemId, sourcePriceCents: currentPriceCents, sourcePriceBasis: "MSI job pack supplier price", discontinued: /discontinued/i.test(rawName), sourceDocument: "MSI Quartz Price Guide · Oct 2025" }));
  }
}

function parseEclos(text, items) {
  const section = text.slice(text.indexOf("FULL SLAB PRICES"), text.indexOf("SILESTONE"));
  for (const raw of section.split("\n")) {
    const match = raw.trim().match(/^(?:Premier|Supra|Luxr)?\s*([A-Za-z]+)\s+NEW\s+j\s+([sg])\s+\$?([\d,]+)\s+\$?([\d,]+)/);
    if (!match) continue;
    const [, materialName, finishCode, , price30] = match;
    addUnique(items, record({ supplier: "Cosentino", collection: "Ēclos", materialName: cleanName(materialName), finish: finishCode === "g" ? "Glossy" : "Smooth", thicknessMm: 30, sourcePriceCents: toCents(price30), sourcePriceBasis: "Jumbo full slab · 30mm", sourceDocument: "Cosentino Price Guide · Sep 2026" }));
  }
}

function parseSilestone(text, items) {
  const section = text.slice(text.indexOf("Group                  Color"), text.indexOf("DEKTON                     p"));
  const groupPriceCents = { 1: 218300, 2: 254100, 3: 289900, 4: 381600, 5: 404200, 6: 453500, 7: 510100 };
  let group = 1;
  let lastItem = null;
  for (const raw of section.split("\n")) {
    let line = raw.trim();
    if (!line || line.startsWith("ɽ") || /^(Prices|Group\s+Color|SILESTONE|KEY)/i.test(line)) continue;
    if (lastItem && /^\$/.test(line)) {
      const continuationPrices = [...line.matchAll(/\$\s*([\d.,]+)/g)].map(match => toCents(match[1]));
      if (continuationPrices.length) lastItem.sourcePriceCents = continuationPrices.at(-1);
      continue;
    }
    const prefixedGroup = line.match(/^(\d+)\s+(.+)$/);
    if (prefixedGroup) { group = Number(prefixedGroup[1]); line = prefixedGroup[2]; }
    else if (/^\d+$/.test(line)) { group = Number(line); continue; }
    const nameMatch = line.match(/^(.+?)\s+(p|l)(?:\s+[pli])?(?:\s|$)/);
    if (!nameMatch || !groupPriceCents[group]) continue;
    const rawName = nameMatch[1].trim();
    if (/^(Technology|Integrity|USD|Jumbo|Dimensions)/i.test(rawName)) continue;
    const listedPrices = [...line.matchAll(/\$\s*([\d.,]+)/g)].map(match => toCents(match[1]));
    const item = record({ supplier: "Cosentino", collection: `Silestone · Group ${group}`, materialName: cleanName(rawName.replace(/\(\d+\)/g, "")), finish: nameMatch[2] === "l" ? "Suede" : "Polished", thicknessMm: 30, sourcePriceCents: listedPrices.at(-1) ?? groupPriceCents[group], sourcePriceBasis: listedPrices.length ? "Jumbo full slab · 30mm" : `Jumbo full slab · 30mm · Group ${group}`, sourceDocument: "Cosentino Price Guide · Sep 2026" });
    addUnique(items, item);
    lastItem = items.at(-1);
  }
  for (const name of ["FFROM 01", "FFROM 02", "FFROM 03"]) addUnique(items, record({ supplier: "Cosentino", collection: "Silestone · Group 4", materialName: name, finish: "Suede", thicknessMm: 30, sourcePriceCents: 419800, sourcePriceBasis: "Jumbo full slab · 30mm · Group 4", sourceDocument: "Cosentino Price Guide · Sep 2026" }));
}

function parseDekton(text, items) {
  const section = text.slice(text.indexOf("Group                  Color          Finish"), text.indexOf("DEKTON                     p"));
  for (const raw of section.split("\n")) {
    let line = raw.trim();
    if (!line || /^(Group|Prices|PORTFOLIO|USD|Antislip|Standard|Jumbo)/i.test(line)) continue;
    const match = line.match(/^(?:\d+\s+)?([A-Za-z][A-Za-z0-9 ]+?)\s+([MPimjN])\s+(.*)$/);
    if (!match) continue;
    const [, rawName, finishCode, priceTail] = match;
    const numbers = [...priceTail.matchAll(/\b\d{1,4}(?:,\d{3})?\b/g)].map(value => toCents(value[0]));
    if (!numbers.length) continue;
    const finishes = { M: "Smooth matte", P: "Polished", i: "Textured matte", m: "Smooth matte", j: "Textured velvet", N: "Velvet" };
    addUnique(items, record({ supplier: "Cosentino", collection: "Dekton", materialName: cleanName(rawName), finish: finishes[finishCode] ?? "Factory finish", thicknessMm: 20, sourcePriceCents: numbers.at(-1), sourcePriceBasis: "Largest listed full slab · 20mm", sourceDocument: "Cosentino Price Guide · Sep 2026" }));
  }
}

function parseCosentinoIndividual(text, items, startMarker, endMarker, collection) {
  const start = text.indexOf(startMarker);
  const end = endMarker ? text.indexOf(endMarker, start + startMarker.length) : text.length;
  const section = text.slice(start, end > start ? end : text.length);
  let pending = null;
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line || /^(PORTFOLIO|Individual slab|Color\s+Type|Prices)/i.test(line)) continue;
    const direct = line.match(/^(.+?)\s+(Granite|Marble|Quartzite|Soapstone)\s+(Brazil|India|Italy|Spain)\s+([A-Za-z]+)\s+\$?([\d.]+)\s+\$?([\d.]+)$/);
    if (direct) {
      const [, rawName, type, , finish, , price30] = direct;
      addUnique(items, record({ supplier: "Cosentino", collection: `${collection} · ${type}`, materialName: cleanName(rawName), finish: title(finish), thicknessMm: 30, sourcePriceCents: toCents(price30), sourcePriceBasis: "Individual slab · 30mm per sq ft", sourceDocument: "Cosentino Price Guide · Sep 2026" }));
      pending = null;
      continue;
    }
    const pendingMatch = line.match(/^(.+?)\s+(Granite|Marble|Quartzite|Soapstone)\s+(Brazil|India|Italy|Spain)$/);
    if (pendingMatch) { pending = { rawName: pendingMatch[1], type: pendingMatch[2] }; continue; }
    const continuation = pending && line.match(/^([A-Za-z]+)\s+\$?([\d.]+)\s+\$?([\d.]+)$/);
    if (continuation) {
      addUnique(items, record({ supplier: "Cosentino", collection: `${collection} · ${pending.type}`, materialName: cleanName(pending.rawName), finish: title(continuation[1]), thicknessMm: 30, sourcePriceCents: toCents(continuation[3]), sourcePriceBasis: "Individual slab · 30mm per sq ft", sourceDocument: "Cosentino Price Guide · Sep 2026" }));
      pending = null;
    }
  }
}

async function main() {
  const [cosentino, msiNatural, msiQuartz] = await Promise.all([
    readFile(path.join(sourceDir, "cosentino.txt"), "utf8"),
    readFile(path.join(sourceDir, "msi-natural-stone.txt"), "utf8"),
    readFile(path.join(sourceDir, "msi-quartz.txt"), "utf8"),
  ]);
  const items = [];
  parseMsiNatural(msiNatural, items);
  parseMsiQuartz(msiQuartz, items);
  parseEclos(cosentino, items);
  parseSilestone(cosentino, items);
  parseDekton(cosentino, items);
  parseCosentinoIndividual(cosentino, items, "Individual slab - USD/sq.ft", "Sensa Amelia Ridge", "Scalea");
  parseCosentinoIndividual(cosentino, items, "Sensa Amelia Ridge", "Mirage         Polished", "Sensa");
  items.sort((a, b) => a.supplier.localeCompare(b.supplier) || a.collection.localeCompare(b.collection) || a.materialName.localeCompare(b.materialName) || a.finish.localeCompare(b.finish));
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(items, null, 2)}\n`);
  const counts = items.reduce((totals, item) => ({ ...totals, [item.supplier]: (totals[item.supplier] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ total: items.length, counts, outputPath }, null, 2));
}

await main();
