export const countertopSuppliers = ["MSI", "Cosentino"] as const;
export type CountertopSupplier = (typeof countertopSuppliers)[number];

export const countertopEdgeProfiles = ["Eased", "Beveled", "Bullnose", "Ogee", "Mitered / Waterfall", "Scalloped", "Fluted", "Double Bullnose", "Triple Bullnose", "Hollywood Bevel"] as const;
export type CountertopEdgeProfile = (typeof countertopEdgeProfiles)[number];
export const countertopRunTypes = ["Perimeter", "Island"] as const;
export type CountertopRunType = (typeof countertopRunTypes)[number];
export const countertopSeamPreferences = ["Auto plan", "Prefer run end", "Avoid visible location"] as const;
export type CountertopSeamPreference = (typeof countertopSeamPreferences)[number];

export type CountertopLaborRates = {
  materialCentsPerSquareFoot: number;
  nonEasedEdgeCentsPerLinearFoot: number;
  sinkCutoutCentsEach: number;
  vanitySinkCutoutCentsEach: number;
  trimCentsPerLinearFoot?: number;
};

export const standardCountertopLaborRates: CountertopLaborRates = { materialCentsPerSquareFoot: 3500, nonEasedEdgeCentsPerLinearFoot: 500, sinkCutoutCentsEach: 10000, vanitySinkCutoutCentsEach: 10000, trimCentsPerLinearFoot: 0 };

export type CountertopRunInput = {
  room: string;
  label: string;
  lengthInches: number;
  depthInches: number;
  edgeLinearFeet: number;
  edgeProfile: CountertopEdgeProfile;
  runType?: CountertopRunType;
  trimLinearFeet?: number;
  windowHeightOffFloorInches?: number | null;
  integratedSink?: boolean;
  seamPreference?: CountertopSeamPreference;
  sinkCutoutCount?: number;
  vanitySinkCutoutCount?: number;
  note?: string | null;
};

export type CountertopSlabPlanInput = { slabLengthInches: number; slabWidthInches: number; planningWastePercent?: number };

export function positiveNumber(value: number, field: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be greater than zero.`);
  return value;
}
export function nonNegativeNumber(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} cannot be negative.`);
  return value;
}

export function calculateCountertopRun(run: CountertopRunInput, rates: CountertopLaborRates = standardCountertopLaborRates) {
  const lengthInches = positiveNumber(run.lengthInches, "Cabinet-top length");
  const depthInches = positiveNumber(run.depthInches, "Cabinet-top depth");
  const edgeLinearFeet = nonNegativeNumber(run.edgeLinearFeet, "Priced edge length");
  const trimLinearFeet = nonNegativeNumber(run.trimLinearFeet ?? 0, "Trim length");
  const sinkCutoutCount = nonNegativeNumber(run.sinkCutoutCount ?? 0, "Sink cutout count");
  const vanitySinkCutoutCount = nonNegativeNumber(run.vanitySinkCutoutCount ?? 0, "Vanity-sink cutout count");
  if (run.windowHeightOffFloorInches != null) nonNegativeNumber(run.windowHeightOffFloorInches, "Window height off floor");
  const squareFeet = lengthInches * depthInches / 144;
  const materialCents = Math.round(squareFeet * rates.materialCentsPerSquareFoot);
  const edgeCents = run.edgeProfile === "Eased" ? 0 : Math.round(edgeLinearFeet * rates.nonEasedEdgeCentsPerLinearFoot);
  const trimCents = Math.round(trimLinearFeet * (rates.trimCentsPerLinearFoot ?? 0));
  const sinkCutoutCents = Math.round(sinkCutoutCount * rates.sinkCutoutCentsEach);
  const vanitySinkCutoutCents = Math.round(vanitySinkCutoutCount * rates.vanitySinkCutoutCentsEach);
  return { squareFeet, materialCents, edgeCents, trimCents, sinkCutoutCents, vanitySinkCutoutCents, totalCents: materialCents + edgeCents + trimCents + sinkCutoutCents + vanitySinkCutoutCents };
}

export function calculateCountertopTakeoffTotals(runs: CountertopRunInput[], rates: CountertopLaborRates = standardCountertopLaborRates) {
  if (!runs.length) throw new Error("Add at least one countertop run before saving the takeoff.");
  return runs.reduce((totals, run) => {
    const calculated = calculateCountertopRun(run, rates);
    return {
      squareFeet: totals.squareFeet + calculated.squareFeet,
      edgeLinearFeet: totals.edgeLinearFeet + run.edgeLinearFeet,
      trimLinearFeet: totals.trimLinearFeet + (run.trimLinearFeet ?? 0),
      sinkCutoutCount: totals.sinkCutoutCount + (run.sinkCutoutCount ?? 0),
      vanitySinkCutoutCount: totals.vanitySinkCutoutCount + (run.vanitySinkCutoutCount ?? 0),
      integratedSinkCount: totals.integratedSinkCount + (run.integratedSink ? 1 : 0),
      materialCents: totals.materialCents + calculated.materialCents,
      edgeCents: totals.edgeCents + calculated.edgeCents,
      trimCents: totals.trimCents + calculated.trimCents,
      sinkCutoutCents: totals.sinkCutoutCents + calculated.sinkCutoutCents,
      vanitySinkCutoutCents: totals.vanitySinkCutoutCents + calculated.vanitySinkCutoutCents,
      totalCents: totals.totalCents + calculated.totalCents,
    };
  }, { squareFeet: 0, edgeLinearFeet: 0, trimLinearFeet: 0, sinkCutoutCount: 0, vanitySinkCutoutCount: 0, integratedSinkCount: 0, materialCents: 0, edgeCents: 0, trimCents: 0, sinkCutoutCents: 0, vanitySinkCutoutCents: 0, totalCents: 0 });
}

export function calculateCountertopSlabPlan(runs: CountertopRunInput[], input: CountertopSlabPlanInput) {
  const slabLengthInches = positiveNumber(input.slabLengthInches, "Slab length");
  const slabWidthInches = positiveNumber(input.slabWidthInches, "Slab width");
  const planningWastePercent = nonNegativeNumber(input.planningWastePercent ?? 10, "Planning waste percentage");
  if (planningWastePercent > 100) throw new Error("Planning waste percentage cannot exceed 100.");
  const takeoff = calculateCountertopTakeoffTotals(runs);
  const slabSquareFeet = slabLengthInches * slabWidthInches / 144;
  const requiredSquareFeet = takeoff.squareFeet * (1 + planningWastePercent / 100);
  const runPlans = runs.map(run => {
    const lengthSegments = Math.max(1, Math.ceil(run.lengthInches / slabLengthInches));
    const widthSegments = Math.max(1, Math.ceil(run.depthInches / slabWidthInches));
    const seamCount = (lengthSegments - 1) * widthSegments + (widthSegments - 1) * lengthSegments;
    const seamPositionsInches = Array.from({ length: Math.max(0, lengthSegments - 1) }, (_, index) => Math.min(run.lengthInches, slabLengthInches * (index + 1)));
    return { label: run.label, runType: run.runType ?? "Perimeter", seamCount, seamPositionsInches, needsWidthReview: run.depthInches > slabWidthInches, needsSeamReview: seamCount > 0 || run.depthInches > slabWidthInches };
  });
  const coverageSlabCount = Math.ceil(requiredSquareFeet / slabSquareFeet);
  const runCapacitySlabCount = Math.max(...runs.map(run => Math.ceil(run.lengthInches / slabLengthInches) * Math.ceil(run.depthInches / slabWidthInches)));
  const slabCount = Math.max(1, coverageSlabCount, runCapacitySlabCount);
  const seamCount = runPlans.reduce((total, run) => total + run.seamCount, 0);
  const plannedCoverageSquareFeet = slabCount * slabSquareFeet;
  return { slabSquareFeet, requiredSquareFeet, slabCount, plannedCoverageSquareFeet, leftoverSquareFeet: Math.max(0, plannedCoverageSquareFeet - requiredSquareFeet), seamCount, runPlans, seamReviewCount: runPlans.filter(run => run.needsSeamReview).length };
}

export function edgeCostBreakdownByRunType(runs: CountertopRunInput[], rates: CountertopLaborRates = standardCountertopLaborRates) {
  return runs.reduce<Record<CountertopRunType, { edgeLinearFeet: number; edgeCents: number; trimLinearFeet: number; trimCents: number }>>((summary, run) => {
    const type = run.runType ?? "Perimeter";
    const priced = calculateCountertopRun(run, rates);
    const current = summary[type];
    summary[type] = { edgeLinearFeet: current.edgeLinearFeet + run.edgeLinearFeet, edgeCents: current.edgeCents + priced.edgeCents, trimLinearFeet: current.trimLinearFeet + (run.trimLinearFeet ?? 0), trimCents: current.trimCents + priced.trimCents };
    return summary;
  }, { Perimeter: { edgeLinearFeet: 0, edgeCents: 0, trimLinearFeet: 0, trimCents: 0 }, Island: { edgeLinearFeet: 0, edgeCents: 0, trimLinearFeet: 0, trimCents: 0 } });
}
