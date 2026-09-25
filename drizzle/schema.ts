import { boolean, foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const cabinetDoorStyles = ["Shaker", "Beveled", "Eyed Edge"] as const;
export const cabinetFinishColors = ["White", "Bisque", "Walnut", "Oak"] as const;
export const cabinetOrderStatuses = ["Draft", "Verified", "Submitted"] as const;
export const uscdPriceTypes = ["Direct", "Planning"] as const;
export const customCabinetSuppliers = ["Sequoia Cabinets", "RA Cabinets"] as const;
export const countertopSuppliers = ["MSI", "Cosentino"] as const;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const cabinetProducts = mysqlTable("cabinet_products", {
  id: int("id").autoincrement().primaryKey(),
  sourceRow: int("sourceRow").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  productCode: varchar("productCode", { length: 80 }).notNull().unique(),
  description: text("description").notNull(),
  boxOnlyCents: int("boxOnlyCents"),
  sourceVersion: varchar("sourceVersion", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("cabinet_products_category_idx").on(table.category)]);

export const cabinetPrices = mysqlTable("cabinet_prices", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => cabinetProducts.id),
  doorStyle: mysqlEnum("doorStyle", cabinetDoorStyles).notNull(),
  finishColor: mysqlEnum("finishColor", cabinetFinishColors).notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  sourceColumn: varchar("sourceColumn", { length: 32 }).notNull(),
  sourceLabel: varchar("sourceLabel", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("cabinet_prices_product_config_unique").on(table.productId, table.doorStyle, table.finishColor)]);

export const cabinetOrders = mysqlTable("cabinet_orders", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerAddress: text("customerAddress").notNull(),
  customerPhone: varchar("customerPhone", { length: 80 }).notNull(),
  shippingMethod: varchar("shippingMethod", { length: 100 }).notNull(),
  estimateNumber: varchar("estimateNumber", { length: 120 }).notNull(),
  installationCents: int("installationCents").default(0).notNull(),
  status: mysqlEnum("status", cabinetOrderStatuses).default("Draft").notNull(),
  verifiedAt: timestamp("verifiedAt"),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("cabinet_orders_owner_idx").on(table.createdByUserId), index("cabinet_orders_status_idx").on(table.status)]);

export const cabinetOrderItems = mysqlTable("cabinet_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().references(() => cabinetOrders.id),
  productId: int("productId").notNull().references(() => cabinetProducts.id),
  priceId: int("priceId").notNull().references(() => cabinetPrices.id),
  productCodeSnapshot: varchar("productCodeSnapshot", { length: 80 }).notNull(),
  descriptionSnapshot: text("descriptionSnapshot").notNull(),
  categorySnapshot: varchar("categorySnapshot", { length: 255 }).notNull(),
  doorStyleSnapshot: mysqlEnum("doorStyleSnapshot", cabinetDoorStyles).notNull(),
  finishColorSnapshot: mysqlEnum("finishColorSnapshot", cabinetFinishColors).notNull(),
  unitPriceCentsSnapshot: int("unitPriceCentsSnapshot").notNull(),
  quantity: int("quantity").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("cabinet_order_items_order_idx").on(table.orderId)]);

/** Source-backed U.S. Cabinet Depot Capital Framed catalog. */
export const uscdProducts = mysqlTable("uscd_products", {
  id: int("id").autoincrement().primaryKey(),
  sourceRow: int("sourceRow").notNull(),
  baseSku: varchar("baseSku", { length: 100 }).notNull().unique(),
  productGroup: varchar("productGroup", { length: 255 }).notNull(),
  description: text("description").notNull(),
  sourceVersion: varchar("sourceVersion", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("uscd_products_group_idx").on(table.productGroup)]);

/** Finish metadata, pricing tier, and Utah availability flags taken from the supplied workbook. */
export const uscdFinishes = mysqlTable("uscd_finishes", {
  id: int("id").autoincrement().primaryKey(),
  finishName: varchar("finishName", { length: 120 }).notNull().unique(),
  skuPrefix: varchar("skuPrefix", { length: 24 }).notNull(),
  tierFactorMicros: int("tierFactorMicros").notNull(),
  transferRequired: boolean("transferRequired").default(false).notNull(),
  discontinued: boolean("discontinued").default(false).notNull(),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Every product/finish order SKU and price. Shaker White is direct; other finish prices are planning values. */
export const uscdPrices = mysqlTable("uscd_prices", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull().references(() => uscdProducts.id),
  finishId: int("finishId").notNull().references(() => uscdFinishes.id),
  orderSku: varchar("orderSku", { length: 120 }).notNull(),
  unitPriceCents: int("unitPriceCents").notNull(),
  priceType: mysqlEnum("priceType", uscdPriceTypes).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("uscd_prices_product_finish_unique").on(table.productId, table.finishId),
  index("uscd_prices_finish_idx").on(table.finishId),
]);

/** A customer-facing U.S. Cabinet Depot package, kept separate from the Woodoo MSRP order records. */
export const uscdPackages = mysqlTable("uscd_packages", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerAddress: text("customerAddress").notNull(),
  customerPhone: varchar("customerPhone", { length: 80 }).notNull(),
  shippingMethod: varchar("shippingMethod", { length: 100 }).notNull(),
  estimateNumber: varchar("estimateNumber", { length: 120 }).notNull(),
  warehouse: varchar("warehouse", { length: 120 }).default("Pickup — Utah").notNull(),
  deliveryCents: int("deliveryCents").default(0).notNull(),
  freightCents: int("freightCents").default(0).notNull(),
  installationCents: int("installationCents").default(0).notNull(),
  primaryFinishId: int("primaryFinishId").references(() => uscdFinishes.id),
  status: mysqlEnum("status", cabinetOrderStatuses).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("uscd_packages_status_idx").on(table.status)]);

/** Quantity and the source form's permitted assembly/modification and add-on adjustments. */
export const uscdPackageItems = mysqlTable("uscd_package_items", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull().references(() => uscdPackages.id),
  productId: int("productId").notNull().references(() => uscdProducts.id),
  quantity: int("quantity").notNull(),
  assemblyModsCents: int("assemblyModsCents").default(0).notNull(),
  assemblyModsNote: text("assemblyModsNote"),
  addonEachCents: int("addonEachCents").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("uscd_package_items_package_idx").on(table.packageId)]);

/** A custom cabinet package priced by individual box count plus trim, panels, and custom door work. */
export const customCabinetPackages = mysqlTable("custom_cabinet_packages", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  supplier: mysqlEnum("supplier", customCabinetSuppliers).notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerAddress: text("customerAddress").notNull(),
  customerPhone: varchar("customerPhone", { length: 80 }).notNull(),
  shippingMethod: varchar("shippingMethod", { length: 100 }).notNull(),
  estimateNumber: varchar("estimateNumber", { length: 120 }).notNull(),
  allWoodDoorPanelCount: int("allWoodDoorPanelCount").default(0).notNull(),
  allWoodDoorPanelEachCents: int("allWoodDoorPanelEachCents").default(0).notNull(),
  installationCents: int("installationCents").default(0).notNull(),
  status: mysqlEnum("status", cabinetOrderStatuses).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("custom_cabinet_packages_owner_idx").on(table.createdByUserId), index("custom_cabinet_packages_supplier_idx").on(table.supplier)]);

/** A sized cabinet selection with its box-count, trim, and panel amounts. */
export const customCabinetPackageItems = mysqlTable("custom_cabinet_package_items", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("packageId").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  room: varchar("room", { length: 120 }).notNull(),
  widthInches: varchar("widthInches", { length: 24 }).notNull(),
  heightInches: varchar("heightInches", { length: 24 }).notNull(),
  depthInches: varchar("depthInches", { length: 24 }).notNull(),
  boxCount: int("boxCount").notNull(),
  boxEachCents: int("boxEachCents").notNull(),
  trimCents: int("trimCents").default(0).notNull(),
  panelCents: int("panelCents").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("custom_cabinet_package_items_package_idx").on(table.packageId),
  foreignKey({
    name: "cc_pkg_items_pkg_id_fk",
    columns: [table.packageId],
    foreignColumns: [customCabinetPackages.id],
  })
]);

/** A supplier-selected countertop material and its cabinet-top takeoff. Pricing rates are saved with the record. */
export const countertopTakeoffs = mysqlTable("countertop_takeoffs", {
  id: int("id").autoincrement().primaryKey(),
  createdByUserId: int("createdByUserId").notNull().references(() => users.id),
  supplier: mysqlEnum("supplier", countertopSuppliers).notNull(),
  slabId: int("slabId").references(() => countertopSlabs.id),
  collection: varchar("collection", { length: 160 }).notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  finish: varchar("finish", { length: 80 }).notNull(),
  materialSourceUrl: text("materialSourceUrl"),
  supplierSlabPriceCents: int("supplierSlabPriceCents").default(0).notNull(),
  supplierSlabPriceBasis: varchar("supplierSlabPriceBasis", { length: 255 }).default("Supplier reference").notNull(),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  estimateNumber: varchar("estimateNumber", { length: 120 }).notNull(),
  materialCentsPerSquareFoot: int("materialCentsPerSquareFoot").default(3500).notNull(),
  nonEasedEdgeCentsPerLinearFoot: int("nonEasedEdgeCentsPerLinearFoot").default(500).notNull(),
  trimCentsPerLinearFoot: int("trimCentsPerLinearFoot").default(0).notNull(),
  laborRateId: int("laborRateId").references(() => countertopLaborRates.id),
  sinkCutoutCentsEach: int("sinkCutoutCentsEach").default(10000).notNull(),
  vanitySinkCutoutCentsEach: int("vanitySinkCutoutCentsEach").default(10000).notNull(),
  slabLengthMilliInches: int("slabLengthMilliInches").default(126000).notNull(),
  slabWidthMilliInches: int("slabWidthMilliInches").default(63000).notNull(),
  planningWasteBasisPoints: int("planningWasteBasisPoints").default(1000).notNull(),
  edgeMode: varchar("edgeMode", { length: 40 }).default("Shared").notNull(),
  sharedEdgeProfile: varchar("sharedEdgeProfile", { length: 80 }),
  perimeterEdgeProfile: varchar("perimeterEdgeProfile", { length: 80 }),
  islandEdgeProfile: varchar("islandEdgeProfile", { length: 80 }),
  status: mysqlEnum("status", cabinetOrderStatuses).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("countertop_takeoffs_owner_idx").on(table.createdByUserId), index("countertop_takeoffs_supplier_idx").on(table.supplier)]);

/** One cabinet-top countertop run; dimensions are stored in thousandths to preserve fractional inch and foot takeoffs. */
export const countertopTakeoffRuns = mysqlTable("countertop_takeoff_runs", {
  id: int("id").autoincrement().primaryKey(),
  takeoffId: int("takeoffId").notNull().references(() => countertopTakeoffs.id),
  room: varchar("room", { length: 120 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  lengthMilliInches: int("lengthMilliInches").notNull(),
  depthMilliInches: int("depthMilliInches").notNull(),
  edgeMilliFeet: int("edgeMilliFeet").default(0).notNull(),
  edgeProfile: varchar("edgeProfile", { length: 80 }).notNull(),
  runType: varchar("runType", { length: 40 }).default("Perimeter").notNull(),
  trimMilliFeet: int("trimMilliFeet").default(0).notNull(),
  windowHeightMilliInches: int("windowHeightMilliInches"),
  integratedSink: boolean("integratedSink").default(false).notNull(),
  seamPreference: varchar("seamPreference", { length: 80 }).default("Auto plan").notNull(),
  sinkCutoutCount: int("sinkCutoutCount").default(0).notNull(),
  vanitySinkCutoutCount: int("vanitySinkCutoutCount").default(0).notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("countertop_takeoff_runs_takeoff_idx").on(table.takeoffId)]);

/** Complete supplier slab catalog normalized from the MSI and Cosentino price guides. */
export const countertopSlabs = mysqlTable("countertop_slabs", {
  id: int("id").autoincrement().primaryKey(),
  supplier: mysqlEnum("supplier", countertopSuppliers).notNull(),
  collection: varchar("collection", { length: 160 }).notNull(),
  materialName: varchar("materialName", { length: 255 }).notNull(),
  finish: varchar("finish", { length: 80 }).notNull(),
  thicknessMm: int("thicknessMm"),
  sourceItemId: varchar("sourceItemId", { length: 160 }),
  imageUrl: text("imageUrl"),
  supplierMaterialUrl: text("supplierMaterialUrl"),
  imageFallbackLabel: varchar("imageFallbackLabel", { length: 160 }).default("Supplier visual reference").notNull(),
  sourcePriceCents: int("sourcePriceCents").notNull(),
  sourcePriceBasis: varchar("sourcePriceBasis", { length: 255 }).notNull(),
  sourceDocument: varchar("sourceDocument", { length: 255 }).notNull(),
  discontinued: boolean("discontinued").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("countertop_slabs_supplier_material_unique").on(table.supplier, table.collection, table.materialName, table.finish, table.thicknessMm),
  index("countertop_slabs_supplier_idx").on(table.supplier),
  index("countertop_slabs_collection_idx").on(table.collection),
]);

/** Backend-configurable rates used for countertop takeoff pricing and snapshot into saved records. */
export const countertopLaborRates = mysqlTable("countertop_labor_rates", {
  id: int("id").autoincrement().primaryKey(),
  label: varchar("label", { length: 120 }).notNull().unique(),
  materialCentsPerSquareFoot: int("materialCentsPerSquareFoot").default(3500).notNull(),
  nonEasedEdgeCentsPerLinearFoot: int("nonEasedEdgeCentsPerLinearFoot").default(500).notNull(),
  trimCentsPerLinearFoot: int("trimCentsPerLinearFoot").default(0).notNull(),
  sinkCutoutCentsEach: int("sinkCutoutCentsEach").default(10000).notNull(),
  vanitySinkCutoutCentsEach: int("vanitySinkCutoutCentsEach").default(10000).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type CabinetOrderStatus = (typeof cabinetOrderStatuses)[number];
export type DoorStyle = (typeof cabinetDoorStyles)[number];
export type FinishColor = (typeof cabinetFinishColors)[number];
export type UsCdPriceType = (typeof uscdPriceTypes)[number];
export type CustomCabinetSupplier = (typeof customCabinetSuppliers)[number];
export type CountertopSupplier = (typeof countertopSuppliers)[number];
