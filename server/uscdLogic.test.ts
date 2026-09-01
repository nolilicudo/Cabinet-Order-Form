import { describe, expect, it } from 'vitest';
import { calculateUsCdLineTotal, calculateUsCdPackageGrandTotal, calculateUsCdPackageTotal, uscdComparisonDelta } from '../shared/uscdLogic';

describe('U.S. Cabinet Depot comparison pricing', () => {
  it('uses a source unit price plus a permitted per-item add-on for each quantity', () => {
    expect(calculateUsCdLineTotal({ unitPriceCents: 12345, quantity: 2, addonEachCents: 6000 })).toBe(36690);
  });

  it('totals a package from source-priced cabinet lines', () => {
    expect(calculateUsCdPackageTotal([
      { unitPriceCents: 10000, quantity: 2, addonEachCents: 0 },
      { unitPriceCents: 5000, quantity: 1, addonEachCents: 2500 },
    ])).toBe(27500);
  });

  it('shows the change from a baseline finish', () => {
    expect(uscdComparisonDelta(31850, 27500)).toBe(4350);
  });

  it('adds supplier delivery and freight to each customer-facing package total', () => {
    expect(calculateUsCdPackageGrandTotal(27500, 12500, 8600)).toBe(48600);
  });

  it('rejects negative supplier delivery or freight inputs', () => {
    expect(() => calculateUsCdPackageGrandTotal(27500, -1, 0)).toThrow('cannot be negative');
  });
});
