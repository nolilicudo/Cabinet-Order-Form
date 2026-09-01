import type { GuidedCabinetWallAssignment } from "./guidedOrderWorkflow";

export const DOOR_STYLES = ["Shaker", "Beveled", "Eyed Edge"] as const;
export const FINISH_COLORS = ["White", "Bisque", "Walnut", "Oak"] as const;
export const ORDER_STATUSES = ["Draft", "Verified", "Submitted"] as const;

export type DoorStyle = (typeof DOOR_STYLES)[number];
export type FinishColor = (typeof FINISH_COLORS)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type CabinetVisualDetail = {
  visual: { sheetUrl: string; x: number; y: number; width: number; height: number } | null;
  dimensions: string | null;
  cabinetType: string;
  helperText: string;
};

export type CatalogItem = {
  priceId: number;
  productId: number;
  productCode: string;
  description: string;
  category: string;
  doorStyle: DoorStyle;
  finishColor: FinishColor;
  unitPriceCents: number;
  sourceLabel: string;
  visual: CabinetVisualDetail;
};

export type SelectedCabinet = CatalogItem & { quantity: number; wallAssignments?: GuidedCabinetWallAssignment[] };

export const WOODOO_QUICK_GROUPS = [
  { id: "base", label: "Base cabinets" },
  { id: "wall", label: "Wall cabinets" },
  { id: "tall", label: "Tall & pantry" },
  { id: "vanity", label: "Vanities" },
  { id: "finishing", label: "Panels & finishing" },
  { id: "accessories", label: "Accessories" },
] as const;

export type WoodooQuickGroup = (typeof WOODOO_QUICK_GROUPS)[number]["id"] | "all";

export function woodooQuickGroupForCategory(category: string): Exclude<WoodooQuickGroup, "all"> {
  const normalized = category.toLowerCase();
  if (normalized.includes("vanity") || normalized.includes("knee drawer")) return "vanity";
  if (normalized.includes("base cabinet") || normalized.includes("sink") || normalized.includes("trash bin")) return "base";
  if (normalized.includes("dummy door") || normalized.includes("dummy drawer") || normalized.includes("panel") || normalized.includes("molding") || normalized.includes("trim") || normalized.includes("filler") || normalized.includes("toe") || normalized.includes("scribe")) return "finishing";
  if (normalized.includes("wall cabinet") || normalized.includes("glass door") || normalized.includes("open shelf")) return "wall";
  if (normalized.includes("tall") || normalized.includes("pantry") || normalized.includes("oven") || normalized.includes("utility")) return "tall";
  return "accessories";
}

export function woodooStyleFamilyLabel(category: string) {
  return category.replace(/\*/g, "").replace(/\s+/g, " ").trim().replace(/\bCABINET\b/gi, "Cabinet");
}

export function woodooQuickSizeLabel(item: Pick<CatalogItem, "productCode" | "visual">) {
  return item.visual.dimensions ?? item.productCode;
}

type UsCdLayoutCandidate = {
  baseSku: string;
  productGroup: string;
  description: string;
  visual: CabinetVisualDetail;
};

export function uscdLayoutFamilyKey(item: UsCdLayoutCandidate) {
  const drawerCountFamily = item.baseSku.toUpperCase().match(/-(\dDB)\d+/)?.[1];
  const normalizedSku = item.baseSku
    .toUpperCase()
    .replace(/\d+(?:-\d+\/\d+)?/g, "#")
    .replace(/#+/g, "#")
    .replace(/[-_]+#/g, "-#");
  return `${item.productGroup.toUpperCase()}::${drawerCountFamily ? `DRAWER-${drawerCountFamily}` : normalizedSku}`;
}

export function uscdLayoutFamilyLabel(item: UsCdLayoutCandidate) {
  const sku = item.baseSku.toUpperCase();
  if (sku.includes("INFIELD")) return "In-field Assembly Kit";
  if (sku.includes("GLIDE")) return "Soft-close Glide Set";
  if (/-3DB\d+/.test(sku)) return "3 Drawer Base Cabinet";
  if (/-2DB\d+/.test(sku)) return "2 Drawer Base Cabinet";
  if (/-B\d+FHTCPO/.test(sku)) return "Full-height Pull-out Base Cabinet";
  if (/-B\d+TCPO/.test(sku)) return "Top-drawer Pull-out Base Cabinet";
  if (/-B\d+FHTD/.test(sku)) return "Full-height Door Base with Top Drawer";
  if (/-B\d+FH\d*RS/.test(sku)) return "Full-height Roll-out Shelf Base Cabinet";
  if (/-B\d+FH/.test(sku)) return "Full-height Door Base Cabinet";
  if (/-B\d+TD/.test(sku)) return "Top-drawer Base Cabinet";
  if (/-B\d+(?:\dRS|RS)/.test(sku)) return "Roll-out Shelf Base Cabinet";
  if (/-B\d+/.test(sku)) return "Standard Base Cabinet";
  const cleaned = item.description
    .replace(/^(?:casselberry|edgeline|haven|oxford|shaker|torrance)\s+[a-z]+\s+/i, "")
    .replace(/["']/g, "")
    .replace(/\b\d+(?:-\d+\/\d+)?(?:\s*[wx×]\s*\d+(?:-\d+\/\d+)?){0,2}\s*(?:h|w|d)?\b/gi, "")
    .replace(/\s*-\s*\d+[a-z0-9-]*/gi, "")
    .replace(/\s*-\s*(?:(?:x|×|\/)\s*)+$/gi, "")
    .replace(/\s+-\s+.*$/g, "")
    .replace(/\s+/g, " ")
    .replace(/[-–—,:;]+$/g, "")
    .trim();
  if (cleaned && cleaned.length <= 58) return cleaned;
  const cabinetType = item.visual.cabinetType?.trim();
  if (cabinetType && cabinetType !== "Cabinet component; use the size and description to confirm fit before adding." && cabinetType !== item.productGroup) return cabinetType;
  return item.productGroup.replace(/&/g, "and");
}

export type UsCdQuickSelectionLine = {
  productId: number;
  baseSku: string;
  description: string;
  productGroup: string;
  finishName?: string;
  unitPriceCents?: number;
  quantity: number;
  assemblyModsNote: string;
  addonEachCents: number;
  wallAssignments?: GuidedCabinetWallAssignment[];
};

export function buildUsCdQuickSelectionPayload(primaryFinishId: number, lines: UsCdQuickSelectionLine[]) {
  return { primaryFinishId, lines };
}

export function hydrateUsCdQuickSelectionLines(lines: UsCdQuickSelectionLine[]) {
  return lines.map(line => ({
    ...line,
    quantity: Math.max(1, line.quantity),
    assemblyModsNote: line.assemblyModsNote ?? "",
    addonEachCents: line.addonEachCents ?? 0,
    wallAssignments: line.wallAssignments ?? [],
  }));
}

export function uscdQuickSelectionSourceDetail(line: Pick<UsCdQuickSelectionLine, "baseSku" | "finishName" | "unitPriceCents">) {
  const finish = line.finishName ?? "Active finish";
  const price = typeof line.unitPriceCents === "number" ? money(line.unitPriceCents) : "source price loading";
  return `${line.baseSku} · ${finish} · ${price} direct source price`;
}

export type SourceStyleComparisonRow = {
  doorStyle: string;
  finishColor: string;
  unitPriceCents: number;
};

export function sourceStyleComparisonRows<T extends SourceStyleComparisonRow>(rows: T[]) {
  return [...rows].sort((left, right) => left.doorStyle.localeCompare(right.doorStyle) || left.finishColor.localeCompare(right.finishColor) || left.unitPriceCents - right.unitPriceCents);
}

export function uscdQuickSizeLabel(item: Pick<UsCdLayoutCandidate, "baseSku" | "visual">) {
  return item.visual.dimensions ?? item.baseSku;
}

export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export const lineTotal = (line: Pick<SelectedCabinet, "unitPriceCents" | "quantity">) => line.unitPriceCents * line.quantity;
export const subtotal = (lines: Array<Pick<SelectedCabinet, "unitPriceCents" | "quantity">>) => lines.reduce((total, line) => total + lineTotal(line), 0);
export const roomFromCategory = (category: string) => category.toLowerCase().includes("vanity") ? "Bath" : "Kitchen";
export const orderDate = (value: Date | string | null | undefined) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) : "—";
