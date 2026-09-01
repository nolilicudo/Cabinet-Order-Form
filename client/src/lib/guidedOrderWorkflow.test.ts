import { describe, expect, it } from "vitest";
import {
  DEFAULT_GUIDED_PROJECT_INPUTS,
  GUIDED_APPLIANCE_PRESETS,
  GUIDED_ORDER_STEPS,
  applyGuidedAppliancePreset,
  createGuidedApplianceOpening,
  formatFeetAndInches,
  guidedPanelGuidanceForSupplier,
  guidedWallRunSummaries,
  parseLengthInches,
  plannedWallRunInches,
  nextGuidedStage,
  unassignedGuidedCabinetQuantity,
  updateGuidedWallAssignment,
  workflowCompleteCount,
} from "./guidedOrderWorkflow";

describe("guided cabinet ordering workflow", () => {
  it("keeps the requested process in a complete 15-step sequence", () => {
    expect(GUIDED_ORDER_STEPS).toHaveLength(15);
    expect(GUIDED_ORDER_STEPS.map(step => step.id)).toEqual([
      "project-inputs", "rooms-walls", "appliance-openings", "cabinet-bodies", "wall-totals",
      "clearances", "fillers", "panels", "molding", "accessories", "manufacturer-rules",
      "elevations", "manufacturer-quote", "resolve-errors", "final-approval",
    ]);
  });

  it("calculates planned wall runs and treats cabinet selection as the cabinet-body milestone", () => {
    const project = { ...DEFAULT_GUIDED_PROJECT_INPUTS, rooms: [
      { id: "a", room: "Kitchen", wall: "Wall A", lengthFeet: "12" },
      { id: "b", room: "Kitchen", wall: "Island", lengthFeet: "8.5" },
    ] };
    expect(plannedWallRunInches(project)).toBe(246);
    expect(formatFeetAndInches(246)).toBe("20' 6\"");
    expect(workflowCompleteCount({ "project-inputs": true }, 0)).toBe(1);
    expect(workflowCompleteCount({ "project-inputs": true }, 2)).toBe(2);
    expect(parseLengthInches('30"W x 34-1/2"H')).toBe(30);
  });

  it("provides standard appliance openings with custom overrides and sequential workflow actions", () => {
    expect(GUIDED_APPLIANCE_PRESETS.map(item => item.id)).toEqual(["Dishwasher", "Sink", "Refrigerator", "Range", "Wall oven", "Microwave over range", "Built-in microwave", "Washer", "Dryer", "Custom"]);
    const dishwasher = createGuidedApplianceOpening("dishwasher");
    expect(dishwasher).toMatchObject({ appliance: "Dishwasher", widthInches: "24", heightInches: "34.5", depthInches: "24" });
    expect(applyGuidedAppliancePreset(dishwasher, "Custom")).toMatchObject({ appliance: "Custom", widthInches: "", heightInches: "", depthInches: "" });
    expect(nextGuidedStage("guided", 0)).toMatchObject({ label: "Next: Add cabinet bodies", target: "gallery", requiresCabinet: false });
    expect(nextGuidedStage("gallery", 0).requiresCabinet).toBe(true);
    expect(nextGuidedStage("gallery", 1)).toMatchObject({ label: "Next: Check wall totals & clearances", target: "checklist" });
    expect(nextGuidedStage("checklist", 1).target).toBe("finalize");
  });

  it("keeps Woodoo exposed panels and U.S. Cabinet Depot end decorative panels as distinct instructions", () => {
    expect(guidedPanelGuidanceForSupplier("woodoo").stepTitle).toBe("Add exposed panels");
    expect(guidedPanelGuidanceForSupplier("woodoo").detail).toContain("ends that will be exposed");
    expect(guidedPanelGuidanceForSupplier("uscd").stepTitle).toBe("Add end decorative panels as needed");
    expect(guidedPanelGuidanceForSupplier("uscd").detail).toContain("finished cabinet end");
  });

  it("assigns cabinet quantities across walls and returns live wall run differences", () => {
    const project = { ...DEFAULT_GUIDED_PROJECT_INPUTS, rooms: [
      { id: "kitchen-a", room: "Kitchen", wall: "Wall A", lengthFeet: "10" },
      { id: "kitchen-b", room: "Kitchen", wall: "Wall B", lengthFeet: "8" },
    ] };
    const assignments = updateGuidedWallAssignment([{ wallId: "kitchen-a", quantity: 1 }, { wallId: "kitchen-b", quantity: 1 }], 1, { quantity: 2 }, 3);
    const summaries = guidedWallRunSummaries(project, [{ quantity: 3, widthInches: 30, wallAssignments: assignments }]);
    expect(assignments).toEqual([{ wallId: "kitchen-a", quantity: 1 }, { wallId: "kitchen-b", quantity: 2 }]);
    expect(unassignedGuidedCabinetQuantity({ quantity: 3, wallAssignments: assignments })).toBe(0);
    expect(summaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ wallId: "kitchen-a", assignedInches: 30, differenceInches: 90 }),
      expect.objectContaining({ wallId: "kitchen-b", assignedInches: 60, differenceInches: 36 }),
    ]));
  });
});
