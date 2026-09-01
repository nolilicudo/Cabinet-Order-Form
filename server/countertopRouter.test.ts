import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mockedDb = vi.hoisted(() => ({
  getWoodooSiteUserId: vi.fn(),
  createCountertopTakeoff: vi.fn(),
  listCountertopTakeoffs: vi.fn(),
  getCountertopTakeoff: vi.fn(),
  listCountertopSlabs: vi.fn(),
  getActiveCountertopLaborRate: vi.fn(),
}));

vi.mock("./db", () => mockedDb);

import { appRouter } from "./routers";

const takeoffInput = {
  slabId: 17,
  materialSourceUrl: "https://www.msisurfaces.com/",
  customerName: "Countertop Validation",
  estimateNumber: "DYP-CT-001",
  slabLengthInches: 126,
  slabWidthInches: 63,
  planningWastePercent: 10,
  trimCentsPerLinearFoot: 250,
  edgeMode: "Split" as const,
  sharedEdgeProfile: null,
  perimeterEdgeProfile: "Beveled" as const,
  islandEdgeProfile: "Eased" as const,
  runs: [{ room: "Kitchen", label: "Island", lengthInches: 96, depthInches: 42, edgeLinearFeet: 7, edgeProfile: "Eased" as const, runType: "Island" as const, trimLinearFeet: 3, windowHeightOffFloorInches: null, integratedSink: false, seamPreference: "Prefer run end" as const, sinkCutoutCount: 1, vanitySinkCutoutCount: 0, note: "Seam review" }],
};

function createCaller() {
  const ctx = { user: null, req: { protocol: "https", headers: {} }, res: {} } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("countertop takeoff procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedDb.getWoodooSiteUserId.mockResolvedValue(1);
    mockedDb.createCountertopTakeoff.mockResolvedValue({ takeoff: { id: 21, estimateNumber: takeoffInput.estimateNumber, supplier: "MSI" }, runs: takeoffInput.runs, totals: { totalCents: 101500 } });
    mockedDb.listCountertopTakeoffs.mockResolvedValue([]);
    mockedDb.getCountertopTakeoff.mockResolvedValue({ takeoff: { id: 21 }, runs: takeoffInput.runs, totals: { totalCents: 101500 } });
    mockedDb.listCountertopSlabs.mockResolvedValue([{ id: 17, supplier: "MSI", materialName: "Calacatta Laza" }]);
    mockedDb.getActiveCountertopLaborRate.mockResolvedValue({ materialCentsPerSquareFoot: 3500, nonEasedEdgeCentsPerLinearFoot: 500, sinkCutoutCentsEach: 10000, vanitySinkCutoutCentsEach: 10000 });
  });

  it("returns full supplier catalog records and persists a cutout-aware countertop takeoff", async () => {
    const caller = createCaller();
    const slabs = await caller.countertops.slabs({ supplier: "MSI" });
    const laborRate = await caller.countertops.laborRate();
    const created = await caller.countertops.create(takeoffInput);
    await caller.countertops.list();
    await caller.countertops.takeoff({ takeoffId: 21 });

    expect(slabs).toEqual([{ id: 17, supplier: "MSI", materialName: "Calacatta Laza" }]);
    expect(laborRate).toMatchObject({ sinkCutoutCentsEach: 10000, vanitySinkCutoutCentsEach: 10000 });
    expect(mockedDb.listCountertopSlabs).toHaveBeenCalledWith("MSI");
    expect(mockedDb.createCountertopTakeoff).toHaveBeenCalledWith(1, takeoffInput);
    expect(created.takeoff).toMatchObject({ id: 21, supplier: "MSI" });
    expect(mockedDb.listCountertopTakeoffs).toHaveBeenCalledOnce();
    expect(mockedDb.getCountertopTakeoff).toHaveBeenCalledWith(21);
  });
});
