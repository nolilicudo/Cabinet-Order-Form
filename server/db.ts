import { and, asc, desc, eq, gt, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  cabinetOrderItems,
  cabinetOrders,
  cabinetPrices,
  cabinetProducts,
  countertopLaborRates,
  countertopSlabs,
  countertopTakeoffRuns,
  countertopTakeoffs,
  customCabinetPackageItems,
  customCabinetPackages,
  InsertUser,
  uscdFinishes,
  uscdPackageItems,
  uscdPackages,
  uscdPrices,
  uscdProducts,
  users,
  type CabinetOrderStatus,
  type CountertopSupplier,
  type CustomCabinetSupplier,
  type DoorStyle,
  type FinishColor,
} from "../drizzle/schema";
import { assertOrderStatusTransition, assertSourcePrice, calculateCabinetGrandTotal, calculateCabinetSubtotal } from "../shared/orderLogic";
import { calculateCustomCabinetGrandTotal } from "../shared/customCabinetLogic";
import { calculateCountertopTakeoffTotals, type CountertopEdgeProfile, type CountertopLaborRates, type CountertopRunType, type CountertopSeamPreference } from "../shared/countertopLogic";
import { calculateUsCdPackageGrandTotal, calculateUsCdPackageTotal } from "../shared/uscdLogic";
import { buildUsCdDuplicateInput, executeUsCdPackageDeletion } from "../shared/uscdPackageActions";
import { getUsCdVisualDetail, getWoodooVisualDetail } from "../shared/visualCatalog";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export type OrderLineInput = { priceId: number; quantity: number };
export type OrderInput = {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingMethod: string;
  estimateNumber: string;
  installationCents: number;
  items: OrderLineInput[];
};

export type UsCdPackageLineInput = {
  productId: number;
  quantity: number;
  assemblyModsNote?: string | null;
  addonEachCents: number;
};

export type UsCdPackageInput = {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingMethod: string;
  estimateNumber: string;
  warehouse: string;
  deliveryCents: number;
  freightCents: number;
  installationCents: number;
  primaryFinishId: number;
  items: UsCdPackageLineInput[];
};

export type CustomCabinetPackageLineInput = {
  description: string;
  room: string;
  widthInches: string;
  heightInches: string;
  depthInches: string;
  boxCount: number;
  boxEachCents: number;
  trimCents: number;
  panelCents: number;
  note?: string | null;
};

export type CustomCabinetPackageInput = {
  supplier: CustomCabinetSupplier;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingMethod: string;
  estimateNumber: string;
  allWoodDoorPanelCount: number;
  allWoodDoorPanelEachCents: number;
  installationCents: number;
  items: CustomCabinetPackageLineInput[];
};

export type CountertopTakeoffRunInput = {
  room: string;
  label: string;
  lengthInches: number;
  depthInches: number;
  edgeLinearFeet: number;
  edgeProfile: CountertopEdgeProfile;
  runType: CountertopRunType;
  trimLinearFeet: number;
  windowHeightOffFloorInches?: number | null;
  integratedSink: boolean;
  seamPreference: CountertopSeamPreference;
  sinkCutoutCount: number;
  vanitySinkCutoutCount: number;
  note?: string | null;
};

export type CountertopTakeoffInput = {
  slabId: number;
  materialSourceUrl?: string | null;
  customerName: string;
  estimateNumber: string;
  slabLengthInches: number;
  slabWidthInches: number;
  planningWastePercent: number;
  trimCentsPerLinearFoot?: number;
  edgeMode: "Shared" | "Split";
  sharedEdgeProfile?: CountertopEdgeProfile | null;
  perimeterEdgeProfile?: CountertopEdgeProfile | null;
  islandEdgeProfile?: CountertopEdgeProfile | null;
  runs: CountertopTakeoffRunInput[];
};

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const woodooSiteOpenId = "woodoo-site-pin-session";

export async function getWoodooSiteUserId() {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  await db.insert(users).values({
    openId: woodooSiteOpenId,
    name: "Woodoo site access",
    loginMethod: "site-pin",
    role: "admin",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({ set: { lastSignedIn: new Date() } });
  const account = await db.select({ id: users.id }).from(users).where(eq(users.openId, woodooSiteOpenId)).limit(1);
  const userId = account[0]?.id;
  if (!userId) throw new Error("The Woodoo site account could not be initialized.");
  return userId;
}

export function getRoomType(category: string) {
  return category.toLowerCase().includes("vanity") ? "Bath" : "Kitchen";
}

export async function getCatalog(filters: { query?: string; doorStyle?: DoorStyle; finishColor?: FinishColor; room?: "Kitchen" | "Bath"; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [gt(cabinetPrices.unitPriceCents, 0)];
  if (filters.doorStyle) conditions.push(eq(cabinetPrices.doorStyle, filters.doorStyle));
  if (filters.finishColor) conditions.push(eq(cabinetPrices.finishColor, filters.finishColor));
  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    conditions.push(or(like(cabinetProducts.productCode, pattern), like(cabinetProducts.description, pattern), like(cabinetProducts.category, pattern))!);
  }
  const rows = await db
    .select({
      priceId: cabinetPrices.id,
      productId: cabinetProducts.id,
      productCode: cabinetProducts.productCode,
      description: cabinetProducts.description,
      category: cabinetProducts.category,
      doorStyle: cabinetPrices.doorStyle,
      finishColor: cabinetPrices.finishColor,
      unitPriceCents: cabinetPrices.unitPriceCents,
      sourceLabel: cabinetPrices.sourceLabel,
    })
    .from(cabinetPrices)
    .innerJoin(cabinetProducts, eq(cabinetPrices.productId, cabinetProducts.id))
    .where(and(...conditions))
    .orderBy(asc(cabinetProducts.category), asc(cabinetProducts.productCode))
    .limit(Math.min(filters.limit ?? 80, 500));
  return rows
    .filter(row => !filters.room || getRoomType(row.category) === filters.room)
    .map(row => ({ ...row, visual: getWoodooVisualDetail(row.productCode, row.category, row.description) }));
}

export async function getWoodooLayoutStyleComparison(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    priceId: cabinetPrices.id,
    productId: cabinetProducts.id,
    productCode: cabinetProducts.productCode,
    description: cabinetProducts.description,
    category: cabinetProducts.category,
    doorStyle: cabinetPrices.doorStyle,
    finishColor: cabinetPrices.finishColor,
    unitPriceCents: cabinetPrices.unitPriceCents,
    sourceLabel: cabinetPrices.sourceLabel,
  }).from(cabinetPrices)
    .innerJoin(cabinetProducts, eq(cabinetPrices.productId, cabinetProducts.id))
    .where(and(eq(cabinetProducts.id, productId), gt(cabinetPrices.unitPriceCents, 0)))
    .orderBy(asc(cabinetPrices.finishColor), asc(cabinetPrices.doorStyle));
  return rows.map(row => ({ ...row, visual: getWoodooVisualDetail(row.productCode, row.category, row.description) }));
}

async function resolveOrderItems(inputItems: OrderLineInput[]) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const quantities = new Map<number, number>();
  for (const item of inputItems) quantities.set(item.priceId, (quantities.get(item.priceId) ?? 0) + item.quantity);
  const priceIds = Array.from(quantities.keys());
  if (!priceIds.length) return [];
  const rows = await db
    .select({
      priceId: cabinetPrices.id,
      productId: cabinetProducts.id,
      productCode: cabinetProducts.productCode,
      description: cabinetProducts.description,
      category: cabinetProducts.category,
      doorStyle: cabinetPrices.doorStyle,
      finishColor: cabinetPrices.finishColor,
      unitPriceCents: cabinetPrices.unitPriceCents,
    })
    .from(cabinetPrices)
    .innerJoin(cabinetProducts, eq(cabinetPrices.productId, cabinetProducts.id))
    .where(inArray(cabinetPrices.id, priceIds));
  if (rows.length !== priceIds.length) throw new Error("One or more cabinet configurations could not be resolved in the Woodoo MSRP catalog.");
  return rows.map(row => {
    assertSourcePrice(row.unitPriceCents);
    return { ...row, quantity: quantities.get(row.priceId) ?? 1 };
  });
}

export function buildItemRows(orderId: number, resolvedItems: Awaited<ReturnType<typeof resolveOrderItems>>) {
  return resolvedItems.map(item => ({
    orderId,
    productId: item.productId,
    priceId: item.priceId,
    productCodeSnapshot: item.productCode,
    descriptionSnapshot: item.description,
    categorySnapshot: item.category,
    doorStyleSnapshot: item.doorStyle,
    finishColorSnapshot: item.finishColor,
    unitPriceCentsSnapshot: item.unitPriceCents,
    quantity: item.quantity,
  }));
}

async function getOrderAccess(orderId: number, userId: number, canManageAll: boolean) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const conditions = canManageAll ? [eq(cabinetOrders.id, orderId)] : [eq(cabinetOrders.id, orderId), eq(cabinetOrders.createdByUserId, userId)];
  const orders = await db.select().from(cabinetOrders).where(and(...conditions)).limit(1);
  const order = orders[0];
  if (!order) throw new Error("Order not found or unavailable.");
  const items = await db.select().from(cabinetOrderItems).where(eq(cabinetOrderItems.orderId, orderId)).orderBy(asc(cabinetOrderItems.id));
  const subtotalCents = calculateCabinetSubtotal(items.map(item => ({ unitPriceCents: item.unitPriceCentsSnapshot, quantity: item.quantity })));
  return { order, items, subtotalCents, totalCents: calculateCabinetGrandTotal(subtotalCents, order.installationCents) };
}

export async function getOrderForUser(orderId: number, userId: number, canManageAll: boolean) {
  return getOrderAccess(orderId, userId, canManageAll);
}

export async function listOrdersForUser(userId: number, canManageAll: boolean) {
  const db = await getDb();
  if (!db) return [];
  const orders = await db
    .select()
    .from(cabinetOrders)
    .where(canManageAll ? undefined : eq(cabinetOrders.createdByUserId, userId))
    .orderBy(desc(cabinetOrders.updatedAt));
  if (!orders.length) return [];
  const items = await db.select().from(cabinetOrderItems).where(inArray(cabinetOrderItems.orderId, orders.map(order => order.id)));
  const grouped = new Map<number, typeof items>();
  for (const item of items) grouped.set(item.orderId, [...(grouped.get(item.orderId) ?? []), item]);
  return orders.map(order => {
    const orderItems = grouped.get(order.id) ?? [];
    const subtotalCents = calculateCabinetSubtotal(orderItems.map(item => ({ unitPriceCents: item.unitPriceCentsSnapshot, quantity: item.quantity })));
    return { ...order, itemCount: orderItems.reduce((count, item) => count + item.quantity, 0), subtotalCents, totalCents: calculateCabinetGrandTotal(subtotalCents, order.installationCents) };
  });
}

function getInsertedId(result: unknown) {
  const value = result as { insertId?: number } | [{ insertId?: number }];
  return Array.isArray(value) ? Number(value[0]?.insertId) : Number(value.insertId);
}

export async function createOrder(userId: number, input: OrderInput) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const resolvedItems = await resolveOrderItems(input.items);
  const result = await db.insert(cabinetOrders).values({
    createdByUserId: userId,
    customerName: input.customerName,
    customerAddress: input.customerAddress,
    customerPhone: input.customerPhone,
    shippingMethod: input.shippingMethod,
    estimateNumber: input.estimateNumber,
    installationCents: input.installationCents,
    status: "Draft",
  });
  const orderId = getInsertedId(result);
  if (!orderId) throw new Error("The order could not be saved.");
  if (resolvedItems.length) await db.insert(cabinetOrderItems).values(buildItemRows(orderId, resolvedItems));
  return getOrderAccess(orderId, userId, true);
}

export async function updateOrder(orderId: number, userId: number, canManageAll: boolean, input: OrderInput) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const existing = await getOrderAccess(orderId, userId, canManageAll);
  if (existing.order.status === "Submitted") throw new Error("Submitted orders are locked from edits. Duplicate the order to make a revision.");
  const resolvedItems = await resolveOrderItems(input.items);
  await db.update(cabinetOrders).set({
    customerName: input.customerName,
    customerAddress: input.customerAddress,
    customerPhone: input.customerPhone,
    shippingMethod: input.shippingMethod,
    estimateNumber: input.estimateNumber,
    installationCents: input.installationCents,
  }).where(eq(cabinetOrders.id, orderId));
  await db.delete(cabinetOrderItems).where(eq(cabinetOrderItems.orderId, orderId));
  if (resolvedItems.length) await db.insert(cabinetOrderItems).values(buildItemRows(orderId, resolvedItems));
  return getOrderAccess(orderId, userId, canManageAll);
}

export async function duplicateOrder(orderId: number, userId: number, canManageAll: boolean) {
  const existing = await getOrderAccess(orderId, userId, canManageAll);
  return createOrder(userId, {
    customerName: existing.order.customerName,
    customerAddress: existing.order.customerAddress,
    customerPhone: existing.order.customerPhone,
    shippingMethod: existing.order.shippingMethod,
    estimateNumber: `${existing.order.estimateNumber}-COPY`,
    installationCents: existing.order.installationCents,
    items: existing.items.map(item => ({ priceId: item.priceId, quantity: item.quantity })),
  });
}

export async function setOrderStatus(orderId: number, userId: number, canManageAll: boolean, status: CabinetOrderStatus) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const existing = await getOrderAccess(orderId, userId, canManageAll);
  assertOrderStatusTransition(existing.order.status, status, existing.items.length);
  await db.update(cabinetOrders).set({
    status,
    verifiedAt: status === "Verified" && !existing.order.verifiedAt ? new Date() : existing.order.verifiedAt,
    submittedAt: status === "Submitted" && !existing.order.submittedAt ? new Date() : existing.order.submittedAt,
  }).where(eq(cabinetOrders.id, orderId));
  return getOrderAccess(orderId, userId, canManageAll);
}

export type OrderDeletionOperations = {
  deleteItems: (orderId: number) => Promise<void>;
  deleteOrder: (orderId: number) => Promise<boolean>;
};

export async function executeOrderDeletion(orderId: number, operations: OrderDeletionOperations) {
  await operations.deleteItems(orderId);
  const deleted = await operations.deleteOrder(orderId);
  if (!deleted) throw new Error("Order not found or unavailable.");
  return { success: true as const, orderId };
}

function affectedRows(result: unknown) {
  const value = Array.isArray(result) ? result[0] : result;
  const count = (value as { affectedRows?: unknown } | undefined)?.affectedRows;
  return typeof count === "number" ? count : 0;
}

export async function deleteOrder(orderId: number, userId: number, canManageAll: boolean) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  await getOrderAccess(orderId, userId, canManageAll);
  return db.transaction(async tx => executeOrderDeletion(orderId, {
    deleteItems: async targetId => {
      await tx.delete(cabinetOrderItems).where(eq(cabinetOrderItems.orderId, targetId));
    },
    deleteOrder: async targetId => {
      const result = await tx.delete(cabinetOrders).where(eq(cabinetOrders.id, targetId));
      return affectedRows(result) > 0;
    },
  }));
}

export async function listUsCdFinishes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(uscdFinishes).orderBy(asc(uscdFinishes.finishName));
}

export async function getUsCdCatalog(filters: { finishId: number; query?: string; group?: string; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(uscdPrices.finishId, filters.finishId), gt(uscdPrices.unitPriceCents, 0)];
  if (filters.query?.trim()) {
    const pattern = `%${filters.query.trim()}%`;
    conditions.push(or(like(uscdProducts.baseSku, pattern), like(uscdProducts.description, pattern))!);
  }
  if (filters.group?.trim()) conditions.push(eq(uscdProducts.productGroup, filters.group.trim()));
  const rows = await db.select({
    productId: uscdProducts.id,
    baseSku: uscdProducts.baseSku,
    productGroup: uscdProducts.productGroup,
    description: uscdProducts.description,
    priceId: uscdPrices.id,
    orderSku: uscdPrices.orderSku,
    unitPriceCents: uscdPrices.unitPriceCents,
    priceType: uscdPrices.priceType,
    finishId: uscdFinishes.id,
    finishName: uscdFinishes.finishName,
    transferRequired: uscdFinishes.transferRequired,
    discontinued: uscdFinishes.discontinued,
  }).from(uscdPrices)
    .innerJoin(uscdProducts, eq(uscdPrices.productId, uscdProducts.id))
    .innerJoin(uscdFinishes, eq(uscdPrices.finishId, uscdFinishes.id))
    .where(and(...conditions))
    .orderBy(asc(uscdProducts.productGroup), asc(uscdProducts.baseSku))
    .limit(Math.min(filters.limit ?? 80, 500));
  return rows.map(row => ({ ...row, visual: getUsCdVisualDetail(row.baseSku, row.productGroup, row.description) }));
}

export async function listUsCdProductGroups() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.selectDistinct({ productGroup: uscdProducts.productGroup }).from(uscdProducts).orderBy(asc(uscdProducts.productGroup));
  return rows.map(row => row.productGroup);
}

export async function getUsCdLayoutStyleComparison(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    productId: uscdProducts.id,
    baseSku: uscdProducts.baseSku,
    productGroup: uscdProducts.productGroup,
    description: uscdProducts.description,
    priceId: uscdPrices.id,
    orderSku: uscdPrices.orderSku,
    unitPriceCents: uscdPrices.unitPriceCents,
    priceType: uscdPrices.priceType,
    finishId: uscdFinishes.id,
    finishName: uscdFinishes.finishName,
    transferRequired: uscdFinishes.transferRequired,
    discontinued: uscdFinishes.discontinued,
  }).from(uscdPrices)
    .innerJoin(uscdProducts, eq(uscdPrices.productId, uscdProducts.id))
    .innerJoin(uscdFinishes, eq(uscdPrices.finishId, uscdFinishes.id))
    .where(and(eq(uscdProducts.id, productId), gt(uscdPrices.unitPriceCents, 0)))
    .orderBy(asc(uscdFinishes.finishName));
  return rows.map(row => ({ ...row, visual: getUsCdVisualDetail(row.baseSku, row.productGroup, row.description) }));
}

async function getUsCdPackageItems(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  const rows = await db.select({
    id: uscdPackageItems.id,
    packageId: uscdPackageItems.packageId,
    productId: uscdProducts.id,
    baseSku: uscdProducts.baseSku,
    productGroup: uscdProducts.productGroup,
    description: uscdProducts.description,
    quantity: uscdPackageItems.quantity,
    assemblyModsNote: uscdPackageItems.assemblyModsNote,
    addonEachCents: uscdPackageItems.addonEachCents,
  }).from(uscdPackageItems)
    .innerJoin(uscdProducts, eq(uscdPackageItems.productId, uscdProducts.id))
    .where(eq(uscdPackageItems.packageId, packageId))
    .orderBy(asc(uscdPackageItems.id));
  return rows.map(row => ({ ...row, visual: getUsCdVisualDetail(row.baseSku, row.productGroup, row.description) }));
}

export async function compareUsCdPackage(finishIds: number[], items: UsCdPackageLineInput[], supplierCosts: { deliveryCents?: number; freightCents?: number; installationCents?: number } = {}) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  const selections = new Map<number, UsCdPackageLineInput>();
  for (const item of items) selections.set(item.productId, item);
  const productIds = Array.from(selections.keys());
  if (!productIds.length || !finishIds.length) return { comparisons: [] };
  const rows = await db.select({
    productId: uscdProducts.id,
    baseSku: uscdProducts.baseSku,
    productGroup: uscdProducts.productGroup,
    description: uscdProducts.description,
    finishId: uscdFinishes.id,
    finishName: uscdFinishes.finishName,
    transferRequired: uscdFinishes.transferRequired,
    discontinued: uscdFinishes.discontinued,
    unitPriceCents: uscdPrices.unitPriceCents,
    orderSku: uscdPrices.orderSku,
    priceType: uscdPrices.priceType,
  }).from(uscdPrices)
    .innerJoin(uscdProducts, eq(uscdPrices.productId, uscdProducts.id))
    .innerJoin(uscdFinishes, eq(uscdPrices.finishId, uscdFinishes.id))
    .where(and(inArray(uscdPrices.productId, productIds), inArray(uscdPrices.finishId, finishIds)));
  const byFinish = new Map<number, typeof rows>();
  for (const row of rows) byFinish.set(row.finishId, [...(byFinish.get(row.finishId) ?? []), row]);
  const deliveryCents = supplierCosts.deliveryCents ?? 0;
  const freightCents = supplierCosts.freightCents ?? 0;
  const installationCents = supplierCosts.installationCents ?? 0;
  const comparisons = finishIds.map(finishId => {
    const finishRows = byFinish.get(finishId) ?? [];
    if (finishRows.length !== productIds.length) throw new Error('One or more selected cabinet items are unavailable in this finish.');
    const lines = finishRows.map(row => {
      const item = selections.get(row.productId)!;
      return {
        ...row,
        visual: getUsCdVisualDetail(row.baseSku, row.productGroup, row.description),
        quantity: item.quantity,
        assemblyModsNote: item.assemblyModsNote ?? null,
        addonEachCents: item.addonEachCents,
      };
    });
    const subtotalCents = calculateUsCdPackageTotal(lines);
    return {
      finish: { id: finishRows[0].finishId, name: finishRows[0].finishName, transferRequired: finishRows[0].transferRequired, discontinued: finishRows[0].discontinued },
      lines,
      subtotalCents,
      deliveryCents,
      freightCents,
      installationCents,
      totalCents: calculateUsCdPackageGrandTotal(subtotalCents, deliveryCents, freightCents, installationCents),
      containsPlanningPrice: lines.some(line => line.priceType === 'Planning'),
    };
  });
  return { comparisons };
}

export async function getUsCdPackage(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  const rows = await db.select().from(uscdPackages).where(eq(uscdPackages.id, packageId)).limit(1);
  const packageRecord = rows[0];
  if (!packageRecord) throw new Error('U.S. Cabinet Depot package not found.');
  const items = await getUsCdPackageItems(packageId);
  const comparison = packageRecord.primaryFinishId ? await compareUsCdPackage([packageRecord.primaryFinishId], items, packageRecord) : { comparisons: [] };
  return { package: packageRecord, items, comparison };
}

export async function listUsCdPackages() {
  const db = await getDb();
  if (!db) return [];
  const packages = await db.select().from(uscdPackages).orderBy(desc(uscdPackages.updatedAt));
  return Promise.all(packages.map(async packageRecord => {
    const items = await getUsCdPackageItems(packageRecord.id);
    const comparison = packageRecord.primaryFinishId ? await compareUsCdPackage([packageRecord.primaryFinishId], items, packageRecord) : { comparisons: [] };
    return { ...packageRecord, itemCount: items.reduce((total, item) => total + item.quantity, 0), subtotalCents: comparison.comparisons[0]?.subtotalCents ?? 0, totalCents: comparison.comparisons[0]?.totalCents ?? 0 };
  }));
}

async function validateUsCdPackageInput(input: UsCdPackageInput) {
  const comparison = await compareUsCdPackage([input.primaryFinishId], input.items, input);
  if (!comparison.comparisons.length) throw new Error('Select at least one cabinet and a finish before saving this package.');
}

export async function createUsCdPackage(userId: number, input: UsCdPackageInput) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  await validateUsCdPackageInput(input);
  const result = await db.insert(uscdPackages).values({ createdByUserId: userId, customerName: input.customerName, customerAddress: input.customerAddress, customerPhone: input.customerPhone, shippingMethod: input.shippingMethod, estimateNumber: input.estimateNumber, warehouse: input.warehouse, deliveryCents: input.deliveryCents, freightCents: input.freightCents, installationCents: input.installationCents, primaryFinishId: input.primaryFinishId });
  const packageId = getInsertedId(result);
  if (!packageId) throw new Error('The U.S. Cabinet Depot package could not be saved.');
  await db.insert(uscdPackageItems).values(input.items.map(item => ({ packageId, productId: item.productId, quantity: item.quantity, assemblyModsCents: 0, assemblyModsNote: item.assemblyModsNote?.trim() || null, addonEachCents: item.addonEachCents })));
  return getUsCdPackage(packageId);
}

export async function updateUsCdPackage(packageId: number, input: UsCdPackageInput) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  const existing = await getUsCdPackage(packageId);
  if (existing.package.status === 'Submitted') throw new Error('Submitted U.S. Cabinet Depot packages are locked from edits.');
  await validateUsCdPackageInput(input);
  await db.update(uscdPackages).set({ customerName: input.customerName, customerAddress: input.customerAddress, customerPhone: input.customerPhone, shippingMethod: input.shippingMethod, estimateNumber: input.estimateNumber, warehouse: input.warehouse, deliveryCents: input.deliveryCents, freightCents: input.freightCents, installationCents: input.installationCents, primaryFinishId: input.primaryFinishId }).where(eq(uscdPackages.id, packageId));
  await db.delete(uscdPackageItems).where(eq(uscdPackageItems.packageId, packageId));
  await db.insert(uscdPackageItems).values(input.items.map(item => ({ packageId, productId: item.productId, quantity: item.quantity, assemblyModsCents: 0, assemblyModsNote: item.assemblyModsNote?.trim() || null, addonEachCents: item.addonEachCents })));
  return getUsCdPackage(packageId);
}

export async function duplicateUsCdPackage(packageId: number, userId: number) {
  const existing = await getUsCdPackage(packageId);
  return createUsCdPackage(userId, buildUsCdDuplicateInput({
    customerName: existing.package.customerName,
    customerAddress: existing.package.customerAddress,
    customerPhone: existing.package.customerPhone,
    shippingMethod: existing.package.shippingMethod,
    estimateNumber: existing.package.estimateNumber,
    warehouse: existing.package.warehouse,
    deliveryCents: existing.package.deliveryCents,
    freightCents: existing.package.freightCents,
    installationCents: existing.package.installationCents,
    primaryFinishId: existing.package.primaryFinishId,
    items: existing.items,
  }));
}

export async function deleteUsCdPackage(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error('The database is unavailable.');
  await getUsCdPackage(packageId);
  return db.transaction(tx => executeUsCdPackageDeletion(packageId, {
    deleteItems: async id => { await tx.delete(uscdPackageItems).where(eq(uscdPackageItems.packageId, id)); },
    deletePackage: async id => affectedRows(await tx.delete(uscdPackages).where(eq(uscdPackages.id, id))) > 0,
  }));
}

async function getCustomCabinetPackageItems(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  return db.select().from(customCabinetPackageItems).where(eq(customCabinetPackageItems.packageId, packageId)).orderBy(asc(customCabinetPackageItems.id));
}

function customCabinetPackageTotals(items: Awaited<ReturnType<typeof getCustomCabinetPackageItems>>, packageRecord: { allWoodDoorPanelCount: number; allWoodDoorPanelEachCents: number; installationCents: number }) {
  return calculateCustomCabinetGrandTotal(items.map(item => ({ boxCount: item.boxCount, boxEachCents: item.boxEachCents, trimCents: item.trimCents, panelCents: item.panelCents })), packageRecord);
}

export async function getCustomCabinetPackage(packageId: number) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const rows = await db.select().from(customCabinetPackages).where(eq(customCabinetPackages.id, packageId)).limit(1);
  const packageRecord = rows[0];
  if (!packageRecord) throw new Error("Custom cabinet package not found.");
  const items = await getCustomCabinetPackageItems(packageId);
  return { package: packageRecord, items, totals: customCabinetPackageTotals(items, packageRecord) };
}

export async function listCustomCabinetPackages() {
  const db = await getDb();
  if (!db) return [];
  const packages = await db.select().from(customCabinetPackages).orderBy(desc(customCabinetPackages.updatedAt));
  return Promise.all(packages.map(async packageRecord => {
    const items = await getCustomCabinetPackageItems(packageRecord.id);
    return { ...packageRecord, itemCount: items.length, totals: customCabinetPackageTotals(items, packageRecord) };
  }));
}

export async function createCustomCabinetPackage(userId: number, input: CustomCabinetPackageInput) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  calculateCustomCabinetGrandTotal(input.items, input);
  const result = await db.insert(customCabinetPackages).values({ createdByUserId: userId, supplier: input.supplier, customerName: input.customerName, customerAddress: input.customerAddress, customerPhone: input.customerPhone, shippingMethod: input.shippingMethod, estimateNumber: input.estimateNumber, allWoodDoorPanelCount: input.allWoodDoorPanelCount, allWoodDoorPanelEachCents: input.allWoodDoorPanelEachCents, installationCents: input.installationCents, status: "Draft" });
  const packageId = getInsertedId(result);
  if (!packageId) throw new Error("The custom cabinet package could not be saved.");
  await db.insert(customCabinetPackageItems).values(input.items.map(item => ({ packageId, description: item.description, room: item.room, widthInches: item.widthInches, heightInches: item.heightInches, depthInches: item.depthInches, boxCount: item.boxCount, boxEachCents: item.boxEachCents, trimCents: item.trimCents, panelCents: item.panelCents, note: item.note?.trim() || null })));
  return getCustomCabinetPackage(packageId);
}

async function getCountertopTakeoffRuns(takeoffId: number) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const rows = await db.select().from(countertopTakeoffRuns).where(eq(countertopTakeoffRuns.takeoffId, takeoffId)).orderBy(asc(countertopTakeoffRuns.id));
  return rows.map(row => ({
    ...row,
    lengthInches: row.lengthMilliInches / 1000,
    depthInches: row.depthMilliInches / 1000,
    edgeLinearFeet: row.edgeMilliFeet / 1000,
    edgeProfile: row.edgeProfile as CountertopEdgeProfile,
    runType: row.runType as CountertopRunType,
    trimLinearFeet: row.trimMilliFeet / 1000,
    windowHeightOffFloorInches: row.windowHeightMilliInches == null ? null : row.windowHeightMilliInches / 1000,
    integratedSink: row.integratedSink,
    seamPreference: row.seamPreference as CountertopSeamPreference,
  }));
}

function countertopTakeoffTotals(runs: Awaited<ReturnType<typeof getCountertopTakeoffRuns>>) {
  return calculateCountertopTakeoffTotals(runs.map(run => ({
    room: run.room,
    label: run.label,
    lengthInches: run.lengthInches,
    depthInches: run.depthInches,
    edgeLinearFeet: run.edgeLinearFeet,
    edgeProfile: run.edgeProfile,
    runType: run.runType,
    trimLinearFeet: run.trimLinearFeet,
    windowHeightOffFloorInches: run.windowHeightOffFloorInches,
    integratedSink: run.integratedSink,
    seamPreference: run.seamPreference,
    sinkCutoutCount: run.sinkCutoutCount,
    vanitySinkCutoutCount: run.vanitySinkCutoutCount,
    note: run.note,
  })));
}

function countertopTakeoffTotalsAtSavedRates(runs: Awaited<ReturnType<typeof getCountertopTakeoffRuns>>, takeoff: { materialCentsPerSquareFoot: number; nonEasedEdgeCentsPerLinearFoot: number; trimCentsPerLinearFoot: number; sinkCutoutCentsEach: number; vanitySinkCutoutCentsEach: number }) {
  return calculateCountertopTakeoffTotals(runs.map(run => ({
    room: run.room,
    label: run.label,
    lengthInches: run.lengthInches,
    depthInches: run.depthInches,
    edgeLinearFeet: run.edgeLinearFeet,
    edgeProfile: run.edgeProfile,
    runType: run.runType,
    trimLinearFeet: run.trimLinearFeet,
    windowHeightOffFloorInches: run.windowHeightOffFloorInches,
    integratedSink: run.integratedSink,
    seamPreference: run.seamPreference,
    sinkCutoutCount: run.sinkCutoutCount,
    vanitySinkCutoutCount: run.vanitySinkCutoutCount,
    note: run.note,
  })), takeoff);
}

export async function getCountertopTakeoff(takeoffId: number) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const rows = await db.select().from(countertopTakeoffs).where(eq(countertopTakeoffs.id, takeoffId)).limit(1);
  const takeoff = rows[0];
  if (!takeoff) throw new Error("Countertop takeoff not found.");
  const runs = await getCountertopTakeoffRuns(takeoffId);
  return { takeoff, runs, totals: countertopTakeoffTotalsAtSavedRates(runs, takeoff) };
}

export async function listCountertopTakeoffs() {
  const db = await getDb();
  if (!db) return [];
  const takeoffs = await db.select().from(countertopTakeoffs).orderBy(desc(countertopTakeoffs.updatedAt));
  return Promise.all(takeoffs.map(async takeoff => {
    const runs = await getCountertopTakeoffRuns(takeoff.id);
    return { ...takeoff, runCount: runs.length, totals: countertopTakeoffTotalsAtSavedRates(runs, takeoff) };
  }));
}

export async function listCountertopSlabs(supplier?: CountertopSupplier) {
  const db = await getDb();
  if (!db) return [];
  return supplier
    ? db.select().from(countertopSlabs).where(eq(countertopSlabs.supplier, supplier)).orderBy(asc(countertopSlabs.collection), asc(countertopSlabs.materialName), asc(countertopSlabs.finish), asc(countertopSlabs.thicknessMm))
    : db.select().from(countertopSlabs).orderBy(asc(countertopSlabs.supplier), asc(countertopSlabs.collection), asc(countertopSlabs.materialName), asc(countertopSlabs.finish), asc(countertopSlabs.thicknessMm));
}

export async function getActiveCountertopLaborRate() {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const [rate] = await db.select().from(countertopLaborRates).where(eq(countertopLaborRates.isActive, true)).orderBy(desc(countertopLaborRates.updatedAt)).limit(1);
  if (!rate) throw new Error("No active countertop labor rate is configured.");
  return rate;
}

export async function createCountertopTakeoff(userId: number, input: CountertopTakeoffInput) {
  const db = await getDb();
  if (!db) throw new Error("The database is unavailable.");
  const [slab] = await db.select().from(countertopSlabs).where(eq(countertopSlabs.id, input.slabId)).limit(1);
  if (!slab) throw new Error("Choose a slab from the countertop catalog before saving.");
  const laborRate = await getActiveCountertopLaborRate();
  const savedRates: CountertopLaborRates = { ...laborRate, trimCentsPerLinearFoot: input.trimCentsPerLinearFoot ?? laborRate.trimCentsPerLinearFoot };
  calculateCountertopTakeoffTotals(input.runs, savedRates);
  const result = await db.insert(countertopTakeoffs).values({
    createdByUserId: userId,
    supplier: slab.supplier,
    slabId: slab.id,
    collection: slab.collection,
    materialName: slab.materialName,
    finish: slab.finish,
    materialSourceUrl: input.materialSourceUrl?.trim() || null,
    supplierSlabPriceCents: slab.sourcePriceCents,
    supplierSlabPriceBasis: slab.sourcePriceBasis,
    customerName: input.customerName,
    estimateNumber: input.estimateNumber,
    materialCentsPerSquareFoot: laborRate.materialCentsPerSquareFoot,
    nonEasedEdgeCentsPerLinearFoot: laborRate.nonEasedEdgeCentsPerLinearFoot,
    trimCentsPerLinearFoot: savedRates.trimCentsPerLinearFoot ?? 0,
    laborRateId: laborRate.id,
    sinkCutoutCentsEach: laborRate.sinkCutoutCentsEach,
    vanitySinkCutoutCentsEach: laborRate.vanitySinkCutoutCentsEach,
    slabLengthMilliInches: Math.round(input.slabLengthInches * 1000),
    slabWidthMilliInches: Math.round(input.slabWidthInches * 1000),
    planningWasteBasisPoints: Math.round(input.planningWastePercent * 100),
    edgeMode: input.edgeMode,
    sharedEdgeProfile: input.sharedEdgeProfile ?? null,
    perimeterEdgeProfile: input.perimeterEdgeProfile ?? null,
    islandEdgeProfile: input.islandEdgeProfile ?? null,
    status: "Draft",
  });
  const takeoffId = getInsertedId(result);
  if (!takeoffId) throw new Error("The countertop takeoff could not be saved.");
  await db.insert(countertopTakeoffRuns).values(input.runs.map(run => ({
    takeoffId,
    room: run.room,
    label: run.label,
    lengthMilliInches: Math.round(run.lengthInches * 1000),
    depthMilliInches: Math.round(run.depthInches * 1000),
    edgeMilliFeet: Math.round(run.edgeLinearFeet * 1000),
    edgeProfile: run.edgeProfile,
    runType: run.runType,
    trimMilliFeet: Math.round(run.trimLinearFeet * 1000),
    windowHeightMilliInches: run.windowHeightOffFloorInches == null ? null : Math.round(run.windowHeightOffFloorInches * 1000),
    integratedSink: run.integratedSink,
    seamPreference: run.seamPreference,
    sinkCutoutCount: run.sinkCutoutCount,
    vanitySinkCutoutCount: run.vanitySinkCutoutCount,
    note: run.note?.trim() || null,
  })));
  return getCountertopTakeoff(takeoffId);
}
