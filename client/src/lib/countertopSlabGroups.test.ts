import { describe, expect, it } from "vitest";
import { groupSlabsForBrowsing, simpleSlabFamily, type SlabBrowseRecord } from "./countertopSlabGroups";

const slab = (overrides: Partial<SlabBrowseRecord>): SlabBrowseRecord => ({ id: 1, supplier: "MSI", collection: "Quartz · Group2", materialName: "Calacatta Example", finish: "Polished", thicknessMm: 20, sourcePriceCents: 1000, sourcePriceBasis: "Reference", sourceDocument: "Guide", discontinued: false, ...overrides });

describe("countertop slab grouping", () => {
  it("collapses MSI quartz price tiers into a single simple Quartz browse family", () => {
    expect(simpleSlabFamily(slab({ collection: "Quartz · Group7" }))).toBe("Quartz");
    expect(simpleSlabFamily(slab({ collection: "Natural Stone · Quartzite" }))).toBe("Quartzite");
  });

  it("uses the top-level Cosentino collection and keeps finish/thickness variants under one material", () => {
    const grouped = groupSlabsForBrowsing([
      slab({ id: 2, supplier: "Cosentino", collection: "Silestone · Group 2", materialName: "Ethereal Glow", finish: "Polished", thicknessMm: 20 }),
      slab({ id: 3, supplier: "Cosentino", collection: "Silestone · Group 2", materialName: "Ethereal Glow", finish: "Suede", thicknessMm: 30 }),
    ]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]).toMatchObject({ family: "Silestone", materialName: "Ethereal Glow" });
    expect(grouped[0].variants).toHaveLength(2);
  });
});
