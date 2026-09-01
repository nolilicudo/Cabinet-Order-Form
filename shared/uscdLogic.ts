export type UsCdComparisonLine = {
  unitPriceCents: number;
  quantity: number;
  addonEachCents: number;
};

export function calculateUsCdLineTotal({ unitPriceCents, quantity, addonEachCents }: UsCdComparisonLine) {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents <= 0) throw new Error('A source-backed U.S. Cabinet Depot unit price is required.');
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantity must be at least one.');
  if (!Number.isInteger(addonEachCents) || addonEachCents < 0) throw new Error('Add-on amount cannot be negative.');
  return quantity * (unitPriceCents + addonEachCents);
}

export function calculateUsCdPackageTotal(lines: UsCdComparisonLine[]) {
  return lines.reduce((total, line) => total + calculateUsCdLineTotal(line), 0);
}

export function calculateUsCdPackageGrandTotal(materialSubtotalCents: number, deliveryCents: number, freightCents: number, installationCents = 0) {
  for (const value of [materialSubtotalCents, deliveryCents, freightCents, installationCents]) {
    if (!Number.isInteger(value) || value < 0) throw new Error('Package totals and supplier delivery, freight, and installation amounts cannot be negative.');
  }
  return materialSubtotalCents + deliveryCents + freightCents + installationCents;
}

export function uscdComparisonDelta(totalCents: number, baselineCents: number) {
  return totalCents - baselineCents;
}
