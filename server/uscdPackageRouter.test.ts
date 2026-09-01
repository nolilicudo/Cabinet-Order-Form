import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getWoodooSiteUserId: vi.fn(),
  createUsCdPackage: vi.fn(),
  getUsCdPackage: vi.fn(),
  updateUsCdPackage: vi.fn(),
  duplicateUsCdPackage: vi.fn(),
  deleteUsCdPackage: vi.fn(),
}));

vi.mock("./db", () => mockedDb);

import { appRouter } from "./routers";

const packageInput = {
  customerName: "Router Test Customer",
  customerAddress: "123 Router Lane, Orem, UT 84057",
  customerPhone: "(801) 555-0199",
  shippingMethod: "Jobsite delivery",
  estimateNumber: "USCD-ROUTER-001",
  warehouse: "Pickup — Utah",
  deliveryCents: 6750,
  freightCents: 1250,
  installationCents: 42800,
  primaryFinishId: 4,
  items: [{ productId: 28, quantity: 2, assemblyModsNote: "Finished end", addonEachCents: 350 }],
};

function createCaller() {
  const ctx = {
    user: null,
    req: { protocol: "https", headers: {} },
    res: {},
  } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("uscd package procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.getWoodooSiteUserId.mockResolvedValue(1);
    mockedDb.createUsCdPackage.mockResolvedValue({ package: { id: 17, estimateNumber: packageInput.estimateNumber } });
    mockedDb.getUsCdPackage.mockResolvedValue({ package: { id: 17, estimateNumber: packageInput.estimateNumber }, items: packageInput.items, comparison: { comparisons: [] } });
    mockedDb.updateUsCdPackage.mockResolvedValue({ package: { id: 17, estimateNumber: packageInput.estimateNumber } });
    mockedDb.duplicateUsCdPackage.mockResolvedValue({ package: { id: 18, estimateNumber: `${packageInput.estimateNumber}-COPY` } });
    mockedDb.deleteUsCdPackage.mockResolvedValue({ success: true, packageId: 17 });
  });

  it("creates and reopens a source-priced package through the router", async () => {
    const caller = createCaller();
    const created = await caller.uscd.createPackage(packageInput);
    const loaded = await caller.uscd.package({ packageId: 17 });

    expect(mockedDb.createUsCdPackage).toHaveBeenCalledWith(1, packageInput);
    expect(created.package.id).toBe(17);
    expect(mockedDb.getUsCdPackage).toHaveBeenCalledWith(17);
    expect(loaded.items).toEqual(packageInput.items);
  });

  it("updates, duplicates, and deletes the intended saved package through the router", async () => {
    const caller = createCaller();
    const updatedInput = { ...packageInput, customerPhone: "(801) 555-0123", deliveryCents: 7000, installationCents: 45900 };
    await caller.uscd.updatePackage({ packageId: 17, package: updatedInput });
    const duplicate = await caller.uscd.duplicatePackage({ packageId: 17 });
    const deleted = await caller.uscd.deletePackage({ packageId: 17 });

    expect(mockedDb.updateUsCdPackage).toHaveBeenCalledWith(17, updatedInput);
    expect(mockedDb.duplicateUsCdPackage).toHaveBeenCalledWith(17, 1);
    expect(duplicate.package.estimateNumber).toBe("USCD-ROUTER-001-COPY");
    expect(mockedDb.deleteUsCdPackage).toHaveBeenCalledWith(17);
    expect(deleted).toEqual({ success: true, packageId: 17 });
  });
});
