import { describe, expect, it } from "vitest";
import { calculateCountertopRun, calculateCountertopSlabPlan, calculateCountertopTakeoffTotals, edgeCostBreakdownByRunType } from "../shared/countertopLogic";

describe("countertop takeoff pricing", () => {
  it("prices cabinet-top area at $35 per square foot and leaves an eased edge at no additional cost", () => {
    expect(calculateCountertopRun({ room: "Kitchen", label: "Wall A", lengthInches: 120, depthInches: 25.2, edgeLinearFeet: 10, edgeProfile: "Eased" })).toMatchObject({ squareFeet: 21, materialCents: 73500, edgeCents: 0, totalCents: 73500 });
  });

  it("adds $5 per linear foot for a non-eased edge and rolls all runs into a package total", () => {
    const totals = calculateCountertopTakeoffTotals([
      { room: "Kitchen", label: "Perimeter", lengthInches: 96, depthInches: 25.5, edgeLinearFeet: 8, edgeProfile: "Ogee" },
      { room: "Kitchen", label: "Island", lengthInches: 84, depthInches: 42, edgeLinearFeet: 7, edgeProfile: "Eased" },
    ]);
    expect(totals).toMatchObject({ squareFeet: 41.5, edgeLinearFeet: 15, materialCents: 145250, edgeCents: 4000, sinkCutoutCents: 0, vanitySinkCutoutCents: 0, totalCents: 149250 });
  });

  it("uses the stored $100 labor amounts for standard and vanity sink cutouts", () => {
    const rate = { materialCentsPerSquareFoot: 3500, nonEasedEdgeCentsPerLinearFoot: 500, sinkCutoutCentsEach: 10000, vanitySinkCutoutCentsEach: 10000 };
    expect(calculateCountertopRun({ room: "Master Bathroom", label: "Vanity", lengthInches: 60, depthInches: 22, edgeLinearFeet: 5, edgeProfile: "Eased", sinkCutoutCount: 1, vanitySinkCutoutCount: 1 }, rate)).toMatchObject({ materialCents: 32083, edgeCents: 0, sinkCutoutCents: 10000, vanitySinkCutoutCents: 10000, totalCents: 52083 });
  });

  it("plans slab count, coverage, and seam review from slab dimensions plus the planning allowance", () => {
    const plan = calculateCountertopSlabPlan([
      { room: "Kitchen", label: "Long wall", lengthInches: 130, depthInches: 25, edgeLinearFeet: 10, edgeProfile: "Eased" },
      { room: "Kitchen", label: "Island", runType: "Island", lengthInches: 72, depthInches: 42, edgeLinearFeet: 8, edgeProfile: "Beveled" },
    ], { slabLengthInches: 126, slabWidthInches: 63, planningWastePercent: 10 });
    expect(plan).toMatchObject({ slabCount: 2, seamCount: 1, seamReviewCount: 1 });
    expect(plan.runPlans[0].seamPositionsInches).toEqual([126]);
  });

  it("keeps integrated sinks off unless deliberately selected and separates perimeter and island trim costs", () => {
    const rates = { materialCentsPerSquareFoot: 3500, nonEasedEdgeCentsPerLinearFoot: 500, sinkCutoutCentsEach: 10000, vanitySinkCutoutCentsEach: 10000, trimCentsPerLinearFoot: 250 };
    const runs = [
      { room: "Kitchen", label: "Wall", runType: "Perimeter" as const, lengthInches: 60, depthInches: 25, edgeLinearFeet: 5, edgeProfile: "Beveled" as const, trimLinearFeet: 3, windowHeightOffFloorInches: 42 },
      { room: "Kitchen", label: "Island", runType: "Island" as const, lengthInches: 72, depthInches: 36, edgeLinearFeet: 6, edgeProfile: "Eased" as const, trimLinearFeet: 2, integratedSink: true },
    ];
    expect(calculateCountertopTakeoffTotals(runs, rates)).toMatchObject({ integratedSinkCount: 1, trimLinearFeet: 5, trimCents: 1250 });
    expect(edgeCostBreakdownByRunType(runs, rates)).toMatchObject({ Perimeter: { edgeCents: 2500, trimCents: 750 }, Island: { edgeCents: 0, trimCents: 500 } });
  });
});
