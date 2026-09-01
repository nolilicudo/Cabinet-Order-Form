import { describe, expect, it } from "vitest";
import { calculateAllWoodDoorPanelTotal, calculateCustomCabinetGrandTotal, calculateCustomCabinetLineTotal } from "./customCabinetLogic";

describe("custom cabinet package costs", () => {
  it("prices each custom sized selection from box count plus trim and panel amounts", () => {
    expect(calculateCustomCabinetLineTotal({ boxCount: 3, boxEachCents: 52500, trimCents: 18000, panelCents: 24000 })).toBe(199500);
  });

  it("includes All Wood Doors panels and installation in the final package total", () => {
    const totals = calculateCustomCabinetGrandTotal([
      { boxCount: 2, boxEachCents: 50000, trimCents: 10000, panelCents: 15000 },
      { boxCount: 1, boxEachCents: 60000, trimCents: 0, panelCents: 5000 },
    ], { allWoodDoorPanelCount: 4, allWoodDoorPanelEachCents: 22500, installationCents: 175000 });
    expect(calculateAllWoodDoorPanelTotal(4, 22500)).toBe(90000);
    expect(totals).toEqual({ cabinetSubtotalCents: 190000, allWoodDoorPanelCents: 90000, installationCents: 175000, totalCents: 455000 });
  });
});
