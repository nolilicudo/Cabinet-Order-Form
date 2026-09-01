import { describe, expect, it } from "vitest";
import { assertOrderStatusTransition, assertSourcePrice, calculateCabinetGrandTotal, calculateCabinetSubtotal } from "../shared/orderLogic";

describe("Woodoo order logic", () => {
  it("calculates a cabinet order subtotal from source-priced line items", () => {
    expect(calculateCabinetSubtotal([
      { unitPriceCents: 5084, quantity: 2 },
      { unitPriceCents: 10776, quantity: 1 },
    ])).toBe(20944);
  });

  it("adds the package installation amount to the order total", () => {
    expect(calculateCabinetGrandTotal(20944, 125000)).toBe(145944);
  });

  it("rejects missing or non-positive source prices", () => {
    expect(() => assertSourcePrice(undefined)).toThrow("active price");
    expect(() => assertSourcePrice(0)).toThrow("active price");
    expect(() => assertSourcePrice(5084)).not.toThrow();
  });

  it("requires cabinet lines before verification", () => {
    expect(() => assertOrderStatusTransition("Draft", "Verified", 0)).toThrow("at least one");
    expect(() => assertOrderStatusTransition("Draft", "Verified", 1)).not.toThrow();
  });

  it("requires verification before submission and locks submitted orders", () => {
    expect(() => assertOrderStatusTransition("Draft", "Submitted", 1)).toThrow("Verified");
    expect(() => assertOrderStatusTransition("Verified", "Submitted", 1)).not.toThrow();
    expect(() => assertOrderStatusTransition("Submitted", "Draft", 1)).toThrow("cannot move");
  });
});
