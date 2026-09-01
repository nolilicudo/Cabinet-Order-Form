export type GuidedWorkflowStep = {
  id: string;
  title: string;
  detail: string;
  section: "Plan" | "Build" | "Verify" | "Approve";
};

export type GuidedRoomWall = {
  id: string;
  room: string;
  customRoomName?: string;
  wall: string;
  lengthFeet: string;
};

export const GUIDED_ROOM_OPTIONS = ["Kitchen", "Laundry", "Kitchenette", "Master Bathroom", "Custom"] as const;
export type GuidedRoomOption = typeof GUIDED_ROOM_OPTIONS[number];

export const GUIDED_APPLIANCE_PRESETS = [
  { id: "Dishwasher", label: "Dishwasher", widthInches: "24", heightInches: "34.5", depthInches: "24", detail: "Standard under-counter opening" },
  { id: "Sink", label: "Sink", widthInches: "30", heightInches: "10", depthInches: "22", detail: "Typical single-bowl sink opening" },
  { id: "Refrigerator", label: "Refrigerator", widthInches: "36", heightInches: "72", depthInches: "36", detail: "Typical full-depth refrigerator allowance" },
  { id: "Range", label: "Range", widthInches: "30", heightInches: "36", depthInches: "25", detail: "Typical freestanding range allowance" },
  { id: "Wall oven", label: "Wall oven", widthInches: "30", heightInches: "29", depthInches: "27", detail: "Typical single wall-oven allowance" },
  { id: "Microwave over range", label: "Microwave over range", widthInches: "30", heightInches: "17", depthInches: "16", detail: "Typical over-range microwave allowance" },
  { id: "Built-in microwave", label: "Built-in microwave", widthInches: "24", heightInches: "14", depthInches: "20", detail: "Typical built-in microwave allowance" },
  { id: "Washer", label: "Washer", widthInches: "27", heightInches: "39", depthInches: "34", detail: "Typical front-load washer allowance" },
  { id: "Dryer", label: "Dryer", widthInches: "27", heightInches: "39", depthInches: "34", detail: "Typical front-load dryer allowance" },
  { id: "Custom", label: "Custom appliance", widthInches: "", heightInches: "", depthInches: "", detail: "Enter the manufacturer-specific opening" },
] as const;
export type GuidedAppliancePresetId = typeof GUIDED_APPLIANCE_PRESETS[number]["id"];

export type GuidedApplianceOpening = {
  id: string;
  appliance: GuidedAppliancePresetId;
  widthInches: string;
  heightInches: string;
  depthInches: string;
  note: string;
};

export type GuidedProjectInputs = {
  projectReference: string;
  rooms: GuidedRoomWall[];
  appliances: GuidedApplianceOpening[];
};

export type GuidedCabinetSupplier = "woodoo" | "uscd";
export type GuidedPanelGuidance = {
  stepTitle: string;
  detail: string;
  summary: string;
};

export const GUIDED_PANEL_GUIDANCE: Record<GuidedCabinetSupplier, GuidedPanelGuidance> = {
  woodoo: {
    stepTitle: "Add exposed panels",
    detail: "For Woodoo, add panels only on cabinet ends that will be exposed after installation.",
    summary: "Woodoo: add exposed panels only where a cabinet end will remain visible.",
  },
  uscd: {
    stepTitle: "Add end decorative panels as needed",
    detail: "For U.S. Cabinet Depot, add an end decorative panel only where a finished cabinet end is needed.",
    summary: "U.S. Cabinet Depot: add end decorative panels only as needed for finished ends.",
  },
};

export function guidedPanelGuidanceForSupplier(supplier: GuidedCabinetSupplier) {
  return GUIDED_PANEL_GUIDANCE[supplier];
}

export type GuidedCabinetWallAssignment = {
  wallId: string;
  quantity: number;
};

export type GuidedWallTrackedCabinet = {
  quantity: number;
  widthInches: number;
  wallAssignments?: GuidedCabinetWallAssignment[];
};

export type GuidedWallRunSummary = {
  wallId: string;
  label: string;
  plannedInches: number;
  assignedInches: number;
  differenceInches: number;
};

export const GUIDED_ORDER_STEPS: GuidedWorkflowStep[] = [
  { id: "project-inputs", title: "Project inputs", detail: "Confirm project reference, customer goals, and cabinet supplier.", section: "Plan" },
  { id: "rooms-walls", title: "Create rooms and walls", detail: "List each cabinet wall and its usable run before placing cabinets.", section: "Plan" },
  { id: "appliance-openings", title: "Add appliance openings", detail: "Record appliance widths and required clearances before cabinet bodies.", section: "Plan" },
  { id: "cabinet-bodies", title: "Add cabinet bodies left to right", detail: "Use the Visual Gallery to add exact, source-priced cabinet sizes in installation order.", section: "Build" },
  { id: "wall-totals", title: "Check wall totals", detail: "Compare the selected cabinet run against the entered wall lengths.", section: "Verify" },
  { id: "clearances", title: "Check door, drawer, and appliance clearances", detail: "Confirm every moving part can open and every appliance opening remains usable.", section: "Verify" },
  { id: "fillers", title: "Add fillers", detail: "Add required fillers where walls, appliances, and cabinet faces need clearance.", section: "Build" },
  { id: "panels", title: "Add required panels", detail: "Use the supplier-specific panel instruction before adding finish pieces.", section: "Build" },
  { id: "molding", title: "Add toe kick, crown, and molding", detail: "Finish the cabinet run with the required trim and molding pieces.", section: "Build" },
  { id: "accessories", title: "Add inserts, hardware, and accessories", detail: "Include required inserts, pullouts, hardware, and functional accessories.", section: "Build" },
  { id: "manufacturer-rules", title: "Apply manufacturer-specific rules", detail: "Review supplier transfer notes, fillers, panels, and configuration rules.", section: "Verify" },
  { id: "elevations", title: "Compare takeoff to elevations", detail: "Confirm the selected quantities and sizes match the design elevations.", section: "Verify" },
  { id: "manufacturer-quote", title: "Compare takeoff to manufacturer quote", detail: "Match source SKU, style, finish, quantity, and price to the supplier quote.", section: "Verify" },
  { id: "resolve-errors", title: "Resolve errors", detail: "Clear every discrepancy before submitting or approving the cabinet package.", section: "Approve" },
  { id: "final-approval", title: "Final approval", detail: "Approve only after the takeoff, quote, and all review checks agree.", section: "Approve" },
];

export const DEFAULT_GUIDED_PROJECT_INPUTS: GuidedProjectInputs = {
  projectReference: "",
  rooms: [{ id: "room-1", room: "Kitchen", wall: "Wall A", lengthFeet: "" }],
  appliances: [],
};

export function appliancePreset(id: GuidedAppliancePresetId) {
  return GUIDED_APPLIANCE_PRESETS.find(item => item.id === id) ?? GUIDED_APPLIANCE_PRESETS[GUIDED_APPLIANCE_PRESETS.length - 1];
}

export function createGuidedApplianceOpening(id: string, appliance: GuidedAppliancePresetId = "Dishwasher"): GuidedApplianceOpening {
  const preset = appliancePreset(appliance);
  return { id, appliance, widthInches: preset.widthInches, heightInches: preset.heightInches, depthInches: preset.depthInches, note: "" };
}

export function applyGuidedAppliancePreset(opening: GuidedApplianceOpening, appliance: GuidedAppliancePresetId): GuidedApplianceOpening {
  const preset = appliancePreset(appliance);
  return { ...opening, appliance, widthInches: preset.widthInches, heightInches: preset.heightInches, depthInches: preset.depthInches };
}

export type GuidedWorkspaceMode = "guided" | "gallery" | "checklist";
export type GuidedNextStage = { label: string; target: "gallery" | "checklist" | "finalize"; requiresCabinet: boolean };

export function nextGuidedStage(mode: GuidedWorkspaceMode, selectedCabinetCount: number): GuidedNextStage {
  if (mode === "guided") return { label: "Next: Add cabinet bodies", target: "gallery", requiresCabinet: false };
  if (mode === "gallery") return selectedCabinetCount > 0
    ? { label: "Next: Check wall totals & clearances", target: "checklist", requiresCabinet: false }
    : { label: "Select a cabinet body to continue", target: "checklist", requiresCabinet: true };
  return selectedCabinetCount > 0
    ? { label: "Next: Finalize cabinet order", target: "finalize", requiresCabinet: false }
    : { label: "Select cabinet bodies to continue", target: "finalize", requiresCabinet: true };
}

export function parseLengthInches(value: string | null | undefined) {
  if (!value) return 0;
  const match = value.match(/(\d+(?:\.\d+)?)(?:\s*\")?\s*(?:W|in|\")?/i);
  return match ? Number(match[1]) : 0;
}

export function plannedWallRunInches(project: GuidedProjectInputs) {
  return project.rooms.reduce((sum, wall) => sum + Number(wall.lengthFeet || 0) * 12, 0);
}

export function guidedWallLabel(wall: GuidedRoomWall) {
  const room = wall.room === "Custom" ? wall.customRoomName?.trim() || "Custom room" : wall.room;
  return `${room} · ${wall.wall.trim() || "Unnamed wall"}`;
}

function wholeCabinetQuantity(value: number) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

export function normalizeGuidedWallAssignments(assignments: GuidedCabinetWallAssignment[] | undefined, cabinetQuantity: number) {
  let remaining = wholeCabinetQuantity(cabinetQuantity);
  return (assignments ?? []).reduce<GuidedCabinetWallAssignment[]>((clean, assignment) => {
    const quantity = Math.min(remaining, wholeCabinetQuantity(assignment.quantity));
    if (!assignment.wallId || quantity === 0) return clean;
    remaining -= quantity;
    return [...clean, { wallId: assignment.wallId, quantity }];
  }, []);
}

export function updateGuidedWallAssignment(assignments: GuidedCabinetWallAssignment[] | undefined, index: number, patch: Partial<GuidedCabinetWallAssignment>, cabinetQuantity: number) {
  const current = assignments ?? [];
  return normalizeGuidedWallAssignments(current.map((assignment, assignmentIndex) => assignmentIndex === index ? { ...assignment, ...patch } : assignment), cabinetQuantity);
}

export function unassignedGuidedCabinetQuantity(cabinet: Pick<GuidedWallTrackedCabinet, "quantity" | "wallAssignments">) {
  const assigned = normalizeGuidedWallAssignments(cabinet.wallAssignments, cabinet.quantity).reduce((sum, assignment) => sum + assignment.quantity, 0);
  return Math.max(0, wholeCabinetQuantity(cabinet.quantity) - assigned);
}

export function guidedWallRunSummaries(project: GuidedProjectInputs, cabinets: GuidedWallTrackedCabinet[]): GuidedWallRunSummary[] {
  return project.rooms.map(wall => {
    const assignedInches = cabinets.reduce((sum, cabinet) => {
      const assignedQuantity = normalizeGuidedWallAssignments(cabinet.wallAssignments, cabinet.quantity)
        .filter(assignment => assignment.wallId === wall.id)
        .reduce((quantity, assignment) => quantity + assignment.quantity, 0);
      return sum + assignedQuantity * Math.max(0, Number(cabinet.widthInches) || 0);
    }, 0);
    const plannedInches = Math.max(0, Number(wall.lengthFeet || 0) * 12);
    return { wallId: wall.id, label: guidedWallLabel(wall), plannedInches, assignedInches, differenceInches: plannedInches - assignedInches };
  });
}

export function workflowCompleteCount(checks: Record<string, boolean>, selectedCabinetCount: number) {
  return GUIDED_ORDER_STEPS.filter(step => step.id === "cabinet-bodies" ? selectedCabinetCount > 0 : checks[step.id]).length;
}

export function formatFeetAndInches(inches: number) {
  if (!Number.isFinite(inches) || inches <= 0) return "Not entered";
  const feet = Math.floor(inches / 12);
  const remainder = Math.round(inches - feet * 12);
  return remainder ? `${feet}' ${remainder}\"` : `${feet}'`;
}
