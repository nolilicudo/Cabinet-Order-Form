export type CabinetOrderStatus = "Draft" | "Verified" | "Submitted";

export type PricedCabinetLine = {
  unitPriceCents: number;
  quantity: number;
};

export function calculateCabinetSubtotal(lines: PricedCabinetLine[]) {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}

export function calculateCabinetGrandTotal(subtotalCents: number, installationCents: number) {
  for (const value of [subtotalCents, installationCents]) {
    if (!Number.isInteger(value) || value < 0) throw new Error("Order totals and installation cost cannot be negative.");
  }
  return subtotalCents + installationCents;
}

export function assertSourcePrice(unitPriceCents: number | undefined) {
  if (!Number.isInteger(unitPriceCents) || !unitPriceCents || unitPriceCents < 1) {
    throw new Error("Each ordered configuration must have an active price in the Woodoo MSRP catalog.");
  }
}

export function assertOrderStatusTransition(previousStatus: CabinetOrderStatus, nextStatus: CabinetOrderStatus, cabinetLineCount: number) {
  if (nextStatus !== "Draft" && cabinetLineCount === 0) {
    throw new Error("An order must contain at least one source-priced cabinet before it can be Verified.");
  }
  if (previousStatus === "Submitted" && nextStatus !== "Submitted") {
    throw new Error("Submitted orders cannot move to another status.");
  }
  if (nextStatus === "Submitted" && previousStatus !== "Verified") {
    throw new Error("An order must be Verified before it can be Submitted.");
  }
}
