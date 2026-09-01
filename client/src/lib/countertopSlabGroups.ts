import type { CountertopSupplier } from "@shared/countertopLogic";

export type SlabBrowseRecord = {
  id: number;
  supplier: CountertopSupplier;
  collection: string;
  materialName: string;
  finish: string;
  thicknessMm: number | null;
  imageUrl: string | null;
  supplierMaterialUrl: string | null;
  imageFallbackLabel: string;
  sourcePriceCents: number;
  sourcePriceBasis: string;
  sourceDocument: string;
  discontinued: boolean;
};

export type SlabMaterialGroup = {
  key: string;
  collection: string;
  materialName: string;
  family: string;
  variants: SlabBrowseRecord[];
};

export function simpleSlabFamily(slab: SlabBrowseRecord) {
  if (slab.supplier === "MSI") return slab.collection.startsWith("Quartz") ? "Quartz" : slab.collection.replace("Natural Stone · ", "");
  return slab.collection.split(" · ")[0];
}

export function groupSlabsForBrowsing(slabs: SlabBrowseRecord[]) {
  const groups = new Map<string, SlabMaterialGroup>();
  slabs.forEach(slab => {
    const key = `${slab.collection}__${slab.materialName}`;
    const current = groups.get(key);
    if (current) current.variants.push(slab);
    else groups.set(key, { key, collection: slab.collection, materialName: slab.materialName, family: simpleSlabFamily(slab), variants: [slab] });
  });
  return Array.from(groups.values()).sort((a, b) => a.materialName.localeCompare(b.materialName));
}
