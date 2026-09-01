import { describe, expect, it } from "vitest";
import { getUsCdVisualDetail, getWoodooVisualDetail } from "../shared/visualCatalog";

describe("visual cabinet catalog metadata", () => {
  it("returns a source-mapped Woodoo layout and dimensions without supplying a price", () => {
    const detail = getWoodooVisualDetail("B12", "BASE CABINET", 'Base Cabinet, 12"W x 34-1/2"H x 24"D, 1 Door');
    expect(detail.visual?.sheetUrl).toContain("/manus-storage/woodoo-complete-layout");
    expect(detail.dimensions).toContain('12"W');
    expect(detail.helperText).toContain("Floor cabinet");
    expect(detail).not.toHaveProperty("unitPriceCents");
  });

  it("returns a source-mapped U.S. Cabinet Depot layout for a base SKU", () => {
    const detail = getUsCdVisualDetail("SW-B12", "Base Cabinets", 'Shaker White Base Cabinet - 12"W x 34-1/2"H x 24"D');
    expect(detail.visual?.sheetUrl).toContain("/manus-storage/uscd-layout");
    expect(detail.cabinetType).toBe("Base Cabinets");
    expect(detail.dimensions).toContain('12"W');
  });
});
