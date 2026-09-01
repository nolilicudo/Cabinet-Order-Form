import { describe, expect, it } from "vitest";
import { buildUsCdProposalModel } from "./uscdProposalPdf";

describe("buildUsCdProposalModel", () => {
  it("retains cabinet lines, finish comparison values, delivery, freight, and package totals", () => {
    const model = buildUsCdProposalModel({
      customerName: "Alex Customer",
      customerAddress: "123 Example Street",
      customerPhone: "(801) 555-0100",
      shippingMethod: "Jobsite delivery",
      estimateNumber: "DYP-9901",
      comparisons: [{
        finish: { name: "Shaker White", transferRequired: false, discontinued: false },
        subtotalCents: 25000,
        deliveryCents: 6750,
        freightCents: 1250,
        totalCents: 33000,
        containsPlanningPrice: false,
        lines: [{ orderSku: "SW-B24", description: "24 in base cabinet", quantity: 2, unitPriceCents: 12000, addonEachCents: 500 }],
      }],
    });

    expect(model.title).toBe("USCD Finish Comparison · DYP-9901");
    expect(model.pricingRows[0]).toMatchObject({ finishName: "Shaker White", cabinetsCents: 25000, deliveryCents: 6750, freightCents: 1250, packageTotalCents: 33000 });
    expect(model.pricingRows[0].lines).toEqual([{ orderSku: "SW-B24", description: "24 in base cabinet", quantity: 2, unitPriceCents: 12000, addonEachCents: 500, lineTotalCents: 25000 }]);
  });
});
