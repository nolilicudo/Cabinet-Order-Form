import { describe, expect, it } from "vitest";
import { calculateCustomCabinetGrandTotal, calculateCustomCabinetLineTotal } from "../shared/customCabinetLogic";

describe("custom cabinet pricing", () => {
  it("calculates a sized selection from boxes, trim, and panels", () => {
    expect(calculateCustomCabinetLineTotal({ boxCount: 3, boxEachCents: 52500, trimCents: 18000, panelCents: 24000 })).toBe(199500);
  });

  it("adds All Wood Doors and installation to the package total", () => {
    expect(calculateCustomCabinetGrandTotal([{ boxCount: 2, boxEachCents: 50000, trimCents: 10000, panelCents: 15000 }], { allWoodDoorPanelCount: 4, allWoodDoorPanelEachCents: 22500, installationCents: 175000 })).toEqual({ cabinetSubtotalCents: 125000, allWoodDoorPanelCents: 90000, installationCents: 175000, totalCents: 390000 });
  });
});
