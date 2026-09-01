import { describe, expect, it } from "vitest";
import { buildUsCdQuickSelectionPayload, hydrateUsCdQuickSelectionLines, sourceStyleComparisonRows, uscdLayoutFamilyKey, uscdLayoutFamilyLabel, uscdQuickSelectionSourceDetail, woodooQuickGroupForCategory, woodooStyleFamilyLabel } from "./woodoo";

describe("Woodoo Quick Select grouping", () => {
  it("places source categories into beginner-friendly cabinet groups", () => {
    expect(woodooQuickGroupForCategory("BASE CABINET 2 Drawers")).toBe("base");
    expect(woodooQuickGroupForCategory("WALL CABINET Glass Door")).toBe("wall");
    expect(woodooQuickGroupForCategory("TALL CABINET Pantry")).toBe("tall");
    expect(woodooQuickGroupForCategory("VANITY SINK BASE")).toBe("vanity");
    expect(woodooQuickGroupForCategory("Finished Panel")).toBe("finishing");
    expect(woodooQuickGroupForCategory("Dummy Door *Shaker and Beveled")).toBe("finishing");
  });

  it("converts raw source categories into readable family-card labels", () => {
    expect(woodooStyleFamilyLabel("BASE CABINET 3 Drawers")).toBe("BASE Cabinet 3 Drawers");
    expect(woodooStyleFamilyLabel("Dummy Door *Shaker and Beveled")).toBe("Dummy Door Shaker and Beveled");
  });

  it("keeps U.S. Cabinet Depot size variants in one layout family", () => {
    const visual = { visual: null, dimensions: null, cabinetType: "Base cabinet", helperText: "" };
    expect(uscdLayoutFamilyKey({ baseSku: "RS18-TypeA", productGroup: "Base Cabinets", description: "Base cabinet", visual }))
      .toBe(uscdLayoutFamilyKey({ baseSku: "RS24-TypeA", productGroup: "Base Cabinets", description: "Base cabinet", visual }));
  });

  it("keeps 2 Drawer Base and 3 Drawer Base SKUs in separate layout families", () => {
    const visual = { visual: null, dimensions: null, cabinetType: "Base cabinet", helperText: "" };
    expect(uscdLayoutFamilyKey({ baseSku: "SW-2DB24", productGroup: "Base Cabinets", description: "Two Drawer Base Cabinet", visual }))
      .not.toBe(uscdLayoutFamilyKey({ baseSku: "SW-3DB24", productGroup: "Base Cabinets", description: "Three Drawer Base Cabinet", visual }));
  });

  it("uses a readable U.S. Cabinet Depot layout-family label", () => {
    const visual = { visual: null, dimensions: null, cabinetType: "Base Cabinets", helperText: "" };
    expect(uscdLayoutFamilyLabel({ baseSku: "SW-3DB18", productGroup: "Base Cabinets", description: "Base cabinet", visual })).toBe("3 Drawer Base Cabinet");
  });

  it("normalizes raw U.S. Cabinet Depot descriptions into concise layout names", () => {
    const visual = { visual: null, dimensions: null, cabinetType: "Base Cabinets", helperText: "" };
    expect(uscdLayoutFamilyLabel({ baseSku: "SW-DCSF42", productGroup: "Base Cabinets", description: "Shaker White Diagonal Corner Sink Front - 26-1/4\"W x 30\"H x 3/4\"D", visual })).toBe("Diagonal Corner Sink Front");
    expect(uscdLayoutFamilyLabel({ baseSku: "SW-BEC24", productGroup: "Base Cabinets", description: "Shaker White Angle Base Cabinet - 24\"W x 34-1/2\"H x 24\"D -2D-2S", visual })).toBe("Angle Base Cabinet");
  });

  it("preserves the exact supplier SKU and finish identifier through grouped quick-selection handoff", () => {
    const payload = buildUsCdQuickSelectionPayload(21, [{ productId: 44, baseSku: "SW-3DB18", description: "3 Drawer Base Cabinet", productGroup: "Base Cabinets", finishName: "Shaker White", unitPriceCents: 22392, quantity: 1, assemblyModsNote: "", addonEachCents: 0, wallAssignments: [{ wallId: "kitchen-a", quantity: 1 }] }]);
    expect(payload.primaryFinishId).toBe(21);
    expect(payload.lines[0]).toMatchObject({ productId: 44, baseSku: "SW-3DB18", finishName: "Shaker White", unitPriceCents: 22392, quantity: 1, wallAssignments: [{ wallId: "kitchen-a", quantity: 1 }] });
  });

  it("retains every same-layout source price while ordering comparison choices by style and finish", () => {
    const styles = sourceStyleComparisonRows([
      { doorStyle: "Shaker", finishColor: "White", unitPriceCents: 5084 },
      { doorStyle: "Beveled", finishColor: "White", unitPriceCents: 5880 },
      { doorStyle: "Eyed Edge", finishColor: "Oak", unitPriceCents: 9106 },
    ]);
    expect(styles).toEqual([
      { doorStyle: "Beveled", finishColor: "White", unitPriceCents: 5880 },
      { doorStyle: "Eyed Edge", finishColor: "Oak", unitPriceCents: 9106 },
      { doorStyle: "Shaker", finishColor: "White", unitPriceCents: 5084 },
    ]);
  });

  it("keeps documented source prices in the same-layout comparison fixture", () => {
    expect(sourceStyleComparisonRows([
      { doorStyle: "Shaker", finishColor: "White", unitPriceCents: 5084 },
      { doorStyle: "Beveled", finishColor: "White", unitPriceCents: 5880 },
      { doorStyle: "Eyed Edge", finishColor: "White", unitPriceCents: 3356 },
      { doorStyle: "Shaker", finishColor: "Walnut", unitPriceCents: 14427 },
      { doorStyle: "Eyed Edge", finishColor: "Oak", unitPriceCents: 9106 },
    ])).toEqual(expect.arrayContaining([
      { doorStyle: "Shaker", finishColor: "White", unitPriceCents: 5084 },
      { doorStyle: "Beveled", finishColor: "White", unitPriceCents: 5880 },
      { doorStyle: "Eyed Edge", finishColor: "White", unitPriceCents: 3356 },
      { doorStyle: "Shaker", finishColor: "Walnut", unitPriceCents: 14427 },
      { doorStyle: "Eyed Edge", finishColor: "Oak", unitPriceCents: 9106 },
    ]));
  });

  it("formats the visible package-builder handoff detail with exact SKU, finish, and source price", () => {
    expect(uscdQuickSelectionSourceDetail({ baseSku: "SW-3DB12", finishName: "Shaker White", unitPriceCents: 19104 })).toBe("SW-3DB12 · Shaker White · $191.04 direct source price");
  });

  it("hydrates grouped U.S. Cabinet Depot Quick Select lines without losing SKU, finish, or source price", () => {
    expect(hydrateUsCdQuickSelectionLines([{ productId: 44, baseSku: "SW-3DB12", description: "Three Drawer Base Cabinet", productGroup: "Base Cabinets", finishName: "Shaker White", unitPriceCents: 19104, quantity: 1, assemblyModsNote: "", addonEachCents: 0, wallAssignments: [{ wallId: "laundry-a", quantity: 1 }] }])).toEqual([
      expect.objectContaining({ baseSku: "SW-3DB12", finishName: "Shaker White", unitPriceCents: 19104, quantity: 1, wallAssignments: [{ wallId: "laundry-a", quantity: 1 }] }),
    ]);
  });
});
