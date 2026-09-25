import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { cabinetDoorStyles, cabinetFinishColors, cabinetOrderStatuses, countertopSuppliers, customCabinetSuppliers } from "../drizzle/schema";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { countertopEdgeProfiles, countertopRunTypes, countertopSeamPreferences } from "../shared/countertopLogic";
import * as db from "./db";
import { hashPassword, verifyPassword } from "./password";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const cabinetLineSchema = z.object({ priceId: z.number().int().positive(), quantity: z.number().int().min(1).max(999) });
const orderPayloadSchema = z.object({
  customerName: z.string().trim().min(1).max(255),
  customerAddress: z.string().trim().min(1).max(4000),
  customerPhone: z.string().trim().min(1).max(80),
  shippingMethod: z.string().trim().min(1).max(100),
  estimateNumber: z.string().trim().min(1).max(120),
  installationCents: z.number().int().min(0).max(5000000).default(0),
  items: z.array(cabinetLineSchema).max(200),
});
const uscdPackageLineSchema = z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(999), assemblyModsNote: z.string().trim().max(1000).optional(), addonEachCents: z.number().int().min(0).max(500000) });
const uscdSupplierCostsSchema = z.object({ deliveryCents: z.number().int().min(0).max(5000000), freightCents: z.number().int().min(0).max(5000000), installationCents: z.number().int().min(0).max(5000000).default(0) });
const uscdPackagePayloadSchema = z.object({ customerName: z.string().trim().min(1).max(255), customerAddress: z.string().trim().min(1).max(4000), customerPhone: z.string().trim().min(1).max(80), shippingMethod: z.string().trim().min(1).max(100), estimateNumber: z.string().trim().min(1).max(120), warehouse: z.string().trim().min(1).max(120), primaryFinishId: z.number().int().positive(), items: z.array(uscdPackageLineSchema).min(1).max(200) }).merge(uscdSupplierCostsSchema);
const customCabinetLineSchema = z.object({ description: z.string().trim().min(1).max(255), room: z.string().trim().min(1).max(120), widthInches: z.string().trim().min(1).max(24), heightInches: z.string().trim().min(1).max(24), depthInches: z.string().trim().min(1).max(24), boxCount: z.number().int().min(1).max(999), boxEachCents: z.number().int().min(0).max(5000000), trimCents: z.number().int().min(0).max(5000000), panelCents: z.number().int().min(0).max(5000000), note: z.string().trim().max(2000).optional() });
const customCabinetPackagePayloadSchema = z.object({ supplier: z.enum(customCabinetSuppliers), customerName: z.string().trim().min(1).max(255), customerAddress: z.string().trim().min(1).max(4000), customerPhone: z.string().trim().min(1).max(80), shippingMethod: z.string().trim().min(1).max(100), estimateNumber: z.string().trim().min(1).max(120), allWoodDoorPanelCount: z.number().int().min(0).max(999), allWoodDoorPanelEachCents: z.number().int().min(0).max(5000000), installationCents: z.number().int().min(0).max(5000000), items: z.array(customCabinetLineSchema).min(1).max(200) });
const countertopRunSchema = z.object({ room: z.string().trim().min(1).max(120), label: z.string().trim().min(1).max(255), lengthInches: z.number().positive().max(1000), depthInches: z.number().positive().max(300), edgeLinearFeet: z.number().min(0).max(1000), edgeProfile: z.enum(countertopEdgeProfiles), runType: z.enum(countertopRunTypes).default("Perimeter"), trimLinearFeet: z.number().min(0).max(1000).default(0), windowHeightOffFloorInches: z.number().min(0).max(600).nullable().optional(), integratedSink: z.boolean().default(false), seamPreference: z.enum(countertopSeamPreferences).default("Auto plan"), sinkCutoutCount: z.number().int().min(0).max(50).default(0), vanitySinkCutoutCount: z.number().int().min(0).max(50).default(0), note: z.string().trim().max(2000).nullable().optional() });
const countertopTakeoffPayloadSchema = z.object({ slabId: z.number().int().positive(), materialSourceUrl: z.string().trim().max(2000).optional(), customerName: z.string().trim().min(1).max(255), estimateNumber: z.string().trim().min(1).max(120), slabLengthInches: z.number().positive().max(1000).default(126), slabWidthInches: z.number().positive().max(500).default(63), planningWastePercent: z.number().min(0).max(100).default(10), trimCentsPerLinearFoot: z.number().int().min(0).max(100000).optional(), edgeMode: z.enum(["Shared", "Split"]).default("Shared"), sharedEdgeProfile: z.enum(countertopEdgeProfiles).nullable().optional(), perimeterEdgeProfile: z.enum(countertopEdgeProfiles).nullable().optional(), islandEdgeProfile: z.enum(countertopEdgeProfiles).nullable().optional(), runs: z.array(countertopRunSchema).min(1).max(200) });

function databaseError(error: unknown): never {
  throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "The order could not be completed." });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({
        email: z.string().email().toLowerCase().trim(),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        const invalidErr = new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });

        if (!user || !user.passwordHash) throw invalidErr;

        const ok = await verifyPassword(input.password, user.passwordHash);
        if (!ok) throw invalidErr;

        // Update last sign-in timestamp
        await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

        // Issue a signed JWT session cookie
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
    // Admin-only: create a new user with email + password
    createUser: adminProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().min(1).max(255),
        password: z.string().min(8).max(128),
        role: z.enum(["user", "admin"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "A user with that email already exists." });
        const passwordHash = await hashPassword(input.password);
        await db.createUserWithPassword({ email: input.email, name: input.name, passwordHash, role: input.role });
        return { success: true };
      }),
  }),
  catalog: router({
    list: publicProcedure.input(z.object({
      query: z.string().max(100).optional(),
      room: z.enum(["Kitchen", "Bath"]).optional(),
      doorStyle: z.enum(cabinetDoorStyles).optional(),
      finishColor: z.enum(cabinetFinishColors).optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }).optional()).query(async ({ input }) => db.getCatalog(input)),
    compareLayout: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => db.getWoodooLayoutStyleComparison(input.productId)),
  }),
  orders: router({
    list: publicProcedure.query(async () => db.listOrdersForUser(await db.getWoodooSiteUserId(), true)),
    get: publicProcedure.input(z.object({ orderId: z.number().int().positive() })).query(async ({ input }) => {
      try { return await db.getOrderForUser(input.orderId, await db.getWoodooSiteUserId(), true); } catch (error) { return databaseError(error); }
    }),
    create: publicProcedure.input(orderPayloadSchema).mutation(async ({ input }) => {
      try { return await db.createOrder(await db.getWoodooSiteUserId(), input); } catch (error) { return databaseError(error); }
    }),
    update: publicProcedure.input(z.object({ orderId: z.number().int().positive(), order: orderPayloadSchema })).mutation(async ({ input }) => {
      try { return await db.updateOrder(input.orderId, await db.getWoodooSiteUserId(), true, input.order); } catch (error) { return databaseError(error); }
    }),
    duplicate: publicProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await db.duplicateOrder(input.orderId, await db.getWoodooSiteUserId(), true); } catch (error) { return databaseError(error); }
    }),
    delete: publicProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await db.deleteOrder(input.orderId, await db.getWoodooSiteUserId(), true); } catch (error) { return databaseError(error); }
    }),
    setStatus: publicProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(cabinetOrderStatuses) })).mutation(async ({ input }) => {
      try { return await db.setOrderStatus(input.orderId, await db.getWoodooSiteUserId(), true, input.status); } catch (error) { return databaseError(error); }
    }),
  }),
  uscd: router({
    finishes: publicProcedure.query(() => db.listUsCdFinishes()),
    groups: publicProcedure.query(() => db.listUsCdProductGroups()),
    catalog: publicProcedure.input(z.object({ finishId: z.number().int().positive(), query: z.string().max(100).optional(), group: z.string().max(255).optional(), limit: z.number().int().min(1).max(500).optional() })).query(({ input }) => db.getUsCdCatalog(input)),
    compareLayout: publicProcedure.input(z.object({ productId: z.number().int().positive() })).query(({ input }) => db.getUsCdLayoutStyleComparison(input.productId)),
    packages: publicProcedure.query(() => db.listUsCdPackages()),
    package: publicProcedure.input(z.object({ packageId: z.number().int().positive() })).query(({ input }) => db.getUsCdPackage(input.packageId)),
    compare: publicProcedure.input(z.object({ finishIds: z.array(z.number().int().positive()).min(1).max(4), items: z.array(uscdPackageLineSchema).min(1).max(200) }).merge(uscdSupplierCostsSchema)).query(({ input }) => db.compareUsCdPackage(input.finishIds, input.items, input)),
    createPackage: publicProcedure.input(uscdPackagePayloadSchema).mutation(async ({ input }) => {
      try { return await db.createUsCdPackage(await db.getWoodooSiteUserId(), input); } catch (error) { return databaseError(error); }
    }),
    updatePackage: publicProcedure.input(z.object({ packageId: z.number().int().positive(), package: uscdPackagePayloadSchema })).mutation(async ({ input }) => {
      try { return await db.updateUsCdPackage(input.packageId, input.package); } catch (error) { return databaseError(error); }
    }),
    duplicatePackage: publicProcedure.input(z.object({ packageId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await db.duplicateUsCdPackage(input.packageId, await db.getWoodooSiteUserId()); } catch (error) { return databaseError(error); }
    }),
    deletePackage: publicProcedure.input(z.object({ packageId: z.number().int().positive() })).mutation(async ({ input }) => {
      try { return await db.deleteUsCdPackage(input.packageId); } catch (error) { return databaseError(error); }
    }),
  }),
  customCabinets: router({
    list: publicProcedure.query(() => db.listCustomCabinetPackages()),
    package: publicProcedure.input(z.object({ packageId: z.number().int().positive() })).query(({ input }) => db.getCustomCabinetPackage(input.packageId)),
    create: publicProcedure.input(customCabinetPackagePayloadSchema).mutation(async ({ input }) => {
      try { return await db.createCustomCabinetPackage(await db.getWoodooSiteUserId(), input); } catch (error) { return databaseError(error); }
    }),
  }),
  countertops: router({
    slabs: publicProcedure.input(z.object({ supplier: z.enum(countertopSuppliers).optional() }).optional()).query(({ input }) => db.listCountertopSlabs(input?.supplier)),
    laborRate: publicProcedure.query(() => db.getActiveCountertopLaborRate()),
    list: publicProcedure.query(() => db.listCountertopTakeoffs()),
    takeoff: publicProcedure.input(z.object({ takeoffId: z.number().int().positive() })).query(async ({ input }) => {
      try { return await db.getCountertopTakeoff(input.takeoffId); } catch (error) { return databaseError(error); }
    }),
    create: publicProcedure.input(countertopTakeoffPayloadSchema).mutation(async ({ input }) => {
      try { return await db.createCountertopTakeoff(await db.getWoodooSiteUserId(), input); } catch (error) { return databaseError(error); }
    }),
  }),
});

export type AppRouter = typeof appRouter;
