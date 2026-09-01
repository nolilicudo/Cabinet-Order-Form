import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getWoodooSiteUserId: vi.fn(),
  createCustomCabinetPackage: vi.fn(),
  listCustomCabinetPackages: vi.fn(),
  getCustomCabinetPackage: vi.fn(),
}));

vi.mock("./db", () => mockedDb);

import { appRouter } from "./routers";

const packageInput = {
  supplier: "Sequoia Cabinets" as const,
  customerName: "Custom Pricing Test",
  customerAddress: "1020 Cabinet Lane, Orem, UT 84057",
  customerPhone: "(801) 555-0188",
  shippingMethod: "Jobsite delivery",
  estimateNumber: "DYP-CUSTOM-001",
  allWoodDoorPanelCount: 3,
  allWoodDoorPanelEachCents: 18500,
  installationCents: 128000,
  items: [{ description: "Sink base", room: "Kitchen", widthInches: "36", heightInches: "34.5", depthInches: "24", boxCount: 2, boxEachCents: 54000, trimCents: 8500, panelCents: 12000, note: "Finished left end" }],
};

function createCaller() {
  const ctx = { user: null, req: { protocol: "https", headers: {} }, res: {} } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("custom cabinet package procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.getWoodooSiteUserId.mockResolvedValue(1);
    mockedDb.createCustomCabinetPackage.mockResolvedValue({ package: { id: 9, estimateNumber: packageInput.estimateNumber, supplier: packageInput.supplier }, items: packageInput.items });
    mockedDb.listCustomCabinetPackages.mockResolvedValue([]);
    mockedDb.getCustomCabinetPackage.mockResolvedValue({ package: { id: 9 }, items: packageInput.items });
  });

  it("persists Sequoia or RA selections with full custom pricing inputs", async () => {
    const caller = createCaller();
    const created = await caller.customCabinets.create(packageInput);
    await caller.customCabinets.list();
    await caller.customCabinets.package({ packageId: 9 });

    expect(mockedDb.createCustomCabinetPackage).toHaveBeenCalledWith(1, packageInput);
    expect(created.package).toMatchObject({ id: 9, supplier: "Sequoia Cabinets" });
    expect(mockedDb.listCustomCabinetPackages).toHaveBeenCalledOnce();
    expect(mockedDb.getCustomCabinetPackage).toHaveBeenCalledWith(9);
  });
});
