import { describe, expect, it, vi } from "vitest";
import { buildUsCdDuplicateInput, buildUsCdPackageUpdateInput, executeUsCdPackageDeletion, hydrateUsCdPackageEditorState } from "../shared/uscdPackageActions";

const savedPackage = {
  customerName: "USCD Test Customer",
  customerAddress: "123 Validation Way, Orem, UT 84057",
  customerPhone: "(801) 555-0123",
  shippingMethod: "Jobsite delivery",
  estimateNumber: "USCD-TEST-20260806",
  warehouse: "Pickup — Utah",
  deliveryCents: 6750,
  freightCents: 1250,
  installationCents: 128500,
  primaryFinishId: 4,
  items: [{ productId: 28, quantity: 2, assemblyModsNote: "Confirm finished ends", addonEachCents: 350 }],
};

describe("U.S. Cabinet Depot saved package actions", () => {
  it("hydrates a reopened package with its customer, freight, finish, and line item details", () => {
    const state = hydrateUsCdPackageEditorState(savedPackage);
    expect(state.form).toMatchObject({ customerName: "USCD Test Customer", estimateNumber: "USCD-TEST-20260806", customerPhone: "(801) 555-0123" });
    expect(state.supplierCosts).toEqual({ deliveryCents: 6750, freightCents: 1250, installationCents: 128500 });
    expect(state.primaryFinishId).toBe(4);
    expect(state.comparisonFinishIds).toEqual([4]);
    expect(state.items).toEqual(savedPackage.items);
  });

  it("builds an update payload that preserves source items and clears blank optional notes", () => {
    const update = buildUsCdPackageUpdateInput({ ...savedPackage, customerPhone: "(801) 555-0199", deliveryCents: 7000, installationCents: 136000, items: [{ ...savedPackage.items[0], assemblyModsNote: "  " }] });
    expect(update.customerPhone).toBe("(801) 555-0199");
    expect(update.deliveryCents).toBe(7000);
    expect(update.freightCents).toBe(1250);
    expect(update.installationCents).toBe(136000);
    expect(update.items).toEqual([{ productId: 28, quantity: 2, assemblyModsNote: undefined, addonEachCents: 350 }]);
  });

  it("builds a duplicate that retains customer, freight, finish, and cabinet data", () => {
    expect(buildUsCdDuplicateInput(savedPackage)).toEqual({
      ...savedPackage,
      estimateNumber: "USCD-TEST-20260806-COPY",
    });
  });

  it("removes package items before the package header", async () => {
    const calls: string[] = [];
    const result = await executeUsCdPackageDeletion(21, {
      deleteItems: async id => { calls.push(`items:${id}`); },
      deletePackage: async id => { calls.push(`package:${id}`); return true; },
    });
    expect(calls).toEqual(["items:21", "package:21"]);
    expect(result).toEqual({ success: true, packageId: 21 });
  });

  it("does not report success when the package header no longer exists", async () => {
    const deletePackage = vi.fn(async () => false);
    await expect(executeUsCdPackageDeletion(21, { deleteItems: async () => undefined, deletePackage })).rejects.toThrow("U.S. Cabinet Depot package not found.");
    expect(deletePackage).toHaveBeenCalledWith(21);
  });
});
