export type CustomCabinetCostLine = {
  boxCount: number;
  boxEachCents: number;
  trimCents: number;
  panelCents: number;
};

export type CustomCabinetPackageCosts = {
  allWoodDoorPanelCount: number;
  allWoodDoorPanelEachCents: number;
  installationCents: number;
};

function nonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`${label} cannot be negative.`);
  return value;
}

export function calculateCustomCabinetLineTotal(line: CustomCabinetCostLine) {
  const boxCount = nonNegativeInteger(line.boxCount, "Box count");
  const boxEachCents = nonNegativeInteger(line.boxEachCents, "Box cost");
  const trimCents = nonNegativeInteger(line.trimCents, "Trim cost");
  const panelCents = nonNegativeInteger(line.panelCents, "Panel cost");
  return boxCount * boxEachCents + trimCents + panelCents;
}

export function calculateCustomCabinetBoxSubtotal(lines: CustomCabinetCostLine[]) {
  return lines.reduce((total, line) => total + calculateCustomCabinetLineTotal(line), 0);
}

export function calculateAllWoodDoorPanelTotal(panelCount: number, panelEachCents: number) {
  return nonNegativeInteger(panelCount, "All Wood Doors panel count") * nonNegativeInteger(panelEachCents, "All Wood Doors panel cost");
}

export function calculateCustomCabinetGrandTotal(lines: CustomCabinetCostLine[], costs: CustomCabinetPackageCosts) {
  const cabinetSubtotalCents = calculateCustomCabinetBoxSubtotal(lines);
  const allWoodDoorPanelCents = calculateAllWoodDoorPanelTotal(costs.allWoodDoorPanelCount, costs.allWoodDoorPanelEachCents);
  const installationCents = nonNegativeInteger(costs.installationCents, "Installation cost");
  return { cabinetSubtotalCents, allWoodDoorPanelCents, installationCents, totalCents: cabinetSubtotalCents + allWoodDoorPanelCents + installationCents };
}
