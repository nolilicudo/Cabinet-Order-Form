import DashboardLayout from "@/components/DashboardLayout";
import { GuidedOrderWorkflow, LayoutReviewChecklist } from "@/components/GuidedOrderWorkflow";
import { VisualCabinetImage } from "@/components/VisualCabinetImage";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GUIDED_PROJECT_INPUTS,
  GUIDED_ROOM_OPTIONS,
  formatFeetAndInches,
  guidedPanelGuidanceForSupplier,
  guidedWallLabel,
  guidedWallRunSummaries,
  nextGuidedStage,
  normalizeGuidedWallAssignments,
  parseLengthInches,
  unassignedGuidedCabinetQuantity,
  updateGuidedWallAssignment,
  type GuidedCabinetWallAssignment,
  type GuidedProjectInputs,
  type GuidedRoomWall,
} from "@/lib/guidedOrderWorkflow";
import {
  DOOR_STYLES,
  FINISH_COLORS,
  buildUsCdQuickSelectionPayload,
  money,
  type CatalogItem,
  type DoorStyle,
  type FinishColor,
  type WoodooQuickGroup,
  WOODOO_QUICK_GROUPS,
  uscdLayoutFamilyKey,
  uscdLayoutFamilyLabel,
  uscdQuickSizeLabel,
  sourceStyleComparisonRows,
  woodooQuickGroupForCategory,
  woodooQuickSizeLabel,
  woodooStyleFamilyLabel,
} from "@/lib/woodoo";
import { trpc } from "@/lib/trpc";
import { ArrowRight, LayoutGrid, ListChecks, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Supplier = "woodoo" | "uscd";
type Mode = "guided" | "gallery" | "checklist";
type WoodooLine = CatalogItem & { quantity: number; wallAssignments: GuidedCabinetWallAssignment[] };
type UsCdLine = { productId: number; baseSku: string; description: string; productGroup: string; finishName?: string; unitPriceCents?: number; quantity: number; assemblyModsNote: string; addonEachCents: number; wallAssignments: GuidedCabinetWallAssignment[] };
type UsCdCatalogItem = {
  productId: number;
  baseSku: string;
  productGroup: string;
  description: string;
  priceId: number;
  orderSku: string;
  unitPriceCents: number;
  priceType: "Direct" | "Planning";
  finishId: number;
  finishName: string;
  transferRequired: boolean;
  discontinued: boolean;
  visual: { visual: { sheetUrl: string; x: number; y: number; width: number; height: number } | null; dimensions: string | null; cabinetType: string; helperText: string };
};

const MODE_COPY: Record<Mode, { title: string; detail: string; icon: typeof Sparkles }> = {
  guided: { title: "Guided start", detail: "Follow the cabinet workflow from project inputs through final approval.", icon: Sparkles },
  gallery: { title: "Visual gallery", detail: "Add source-priced cabinet products left to right, by pictured layout and size.", icon: LayoutGrid },
  checklist: { title: "Layout checklist", detail: "Review the takeoff, clearances, finish pieces, rules, and approvals while ordering.", icon: ListChecks },
};

function sizeSortValue(item: CatalogItem) {
  const source = item.visual.dimensions ?? item.productCode;
  const firstNumber = source.match(/\d+(?:-\d+\/\d+)?/);
  return firstNumber ? Number(firstNumber[0].split("-")[0]) : 9999;
}

function WallAssignmentControls({ quantity, assignments, walls, onAssignOne, onUpdate, onRemove }: { quantity: number; assignments: GuidedCabinetWallAssignment[]; walls: GuidedRoomWall[]; onAssignOne: () => void; onUpdate: (index: number, patch: Partial<GuidedCabinetWallAssignment>) => void; onRemove: (index: number) => void }) {
  const unassigned = unassignedGuidedCabinetQuantity({ quantity, wallAssignments: assignments });
  return <div className="mt-3 border-t border-[#ece8df] pt-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#718076]">Wall placement</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${unassigned ? "bg-[#fff0ed] text-[#9c4438]" : "bg-[#e5f2e6] text-[#0d3b26]"}`}>{unassigned ? `${unassigned} unassigned` : "All assigned"}</span></div>{assignments.map((assignment, index) => <div key={`${assignment.wallId}-${index}`} className="mt-2 grid grid-cols-[1fr_58px_auto] gap-2"><select aria-label={`Wall for cabinet placement ${index + 1}`} value={assignment.wallId} onChange={event => onUpdate(index, { wallId: event.target.value })} className="woodoo-input h-8 text-[11px]">{walls.map(wall => <option key={wall.id} value={wall.id}>{guidedWallLabel(wall)}</option>)}</select><input aria-label={`Cabinet quantity on wall ${index + 1}`} className="woodoo-input h-8 text-center text-[11px]" type="number" min="0" max={quantity} value={assignment.quantity} onChange={event => onUpdate(index, { quantity: Number(event.target.value || 0) })} /><button aria-label={`Remove wall placement ${index + 1}`} onClick={() => onRemove(index)} className="rounded-lg border border-[#ead8d3] px-2 text-[#a34c40] hover:bg-[#fff3f0]"><Trash2 size={13} /></button></div>)}<button disabled={!walls.length || unassigned === 0} onClick={onAssignOne} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#0d3b26] underline decoration-[#9cbd9b] underline-offset-4 disabled:cursor-not-allowed disabled:text-[#9ba69e]"> <Plus size={12} /> Assign one cabinet to a wall</button>{!walls.length && <p className="mt-2 text-[11px] text-[#9c4438]">Add a wall before assigning cabinet bodies.</p>}</div>;
}

export default function QuickSelectPage() {
  const [, setLocation] = useLocation();
  const [supplier, setSupplier] = useState<Supplier>("woodoo");
  const [mode, setMode] = useState<Mode>("guided");
  const [woodooDoor, setWoodooDoor] = useState<DoorStyle>("Shaker");
  const [woodooFinish, setWoodooFinish] = useState<FinishColor>("White");
  const [woodooRoom, setWoodooRoom] = useState<"Kitchen" | "Laundry" | "Kitchenette" | "Master Bathroom" | "Custom">("Kitchen");
  const [woodooGroup, setWoodooGroup] = useState<WoodooQuickGroup>("base");
  const [uscdFinishId, setUsCdFinishId] = useState<number>();
  const [uscdGroup, setUsCdGroup] = useState("Base Cabinets");
  const [comparisonProduct, setComparisonProduct] = useState<CatalogItem>();
  const [uscdComparisonProduct, setUsCdComparisonProduct] = useState<UsCdCatalogItem>();
  const [woodooLines, setWoodooLines] = useState<WoodooLine[]>([]);
  const [uscdLines, setUsCdLines] = useState<UsCdLine[]>([]);
  const [guidedInputs, setGuidedInputs] = useState<GuidedProjectInputs>(() => ({ ...DEFAULT_GUIDED_PROJECT_INPUTS, rooms: DEFAULT_GUIDED_PROJECT_INPUTS.rooms.map(room => ({ ...room })) }));
  const [workflowChecks, setWorkflowChecks] = useState<Record<string, boolean>>({});
  const finishes = trpc.uscd.finishes.useQuery();
  const groups = trpc.uscd.groups.useQuery();

  useEffect(() => {
    if (!uscdFinishId && finishes.data?.length) setUsCdFinishId((finishes.data.find(item => item.finishName === "Shaker White") ?? finishes.data[0]).id);
  }, [finishes.data, uscdFinishId]);

  useEffect(() => {
    const validWallIds = new Set(guidedInputs.rooms.map(room => room.id));
    const cleanAssignments = <T extends { wallAssignments: GuidedCabinetWallAssignment[] }>(lines: T[]) => {
      let changed = false;
      const next = lines.map(line => {
        const assignments = line.wallAssignments.filter(assignment => validWallIds.has(assignment.wallId));
        if (assignments.length === line.wallAssignments.length) return line;
        changed = true;
        return { ...line, wallAssignments: assignments };
      });
      return changed ? next : lines;
    };
    setWoodooLines(current => cleanAssignments(current));
    setUsCdLines(current => cleanAssignments(current));
  }, [guidedInputs.rooms]);

  const woodooCatalogRoom: "Kitchen" | "Bath" | undefined = woodooRoom === "Master Bathroom" ? "Bath" : woodooRoom === "Kitchen" || woodooRoom === "Kitchenette" ? "Kitchen" : undefined;
  const woodooFilters = useMemo(() => ({ room: woodooCatalogRoom, doorStyle: woodooDoor, finishColor: woodooFinish, limit: 500 }), [woodooCatalogRoom, woodooDoor, woodooFinish]);
  const woodooCatalog = trpc.catalog.list.useQuery(woodooFilters, { enabled: supplier === "woodoo" });
  const uscdCatalog = trpc.uscd.catalog.useQuery({ finishId: uscdFinishId ?? 0, group: uscdGroup || undefined, limit: 500 }, { enabled: supplier === "uscd" && Boolean(uscdFinishId) });
  const layoutStyleComparison = trpc.catalog.compareLayout.useQuery({ productId: comparisonProduct?.productId ?? 0 }, { enabled: supplier === "woodoo" && Boolean(comparisonProduct?.productId) });
  const uscdLayoutStyleComparison = trpc.uscd.compareLayout.useQuery({ productId: uscdComparisonProduct?.productId ?? 0 }, { enabled: supplier === "uscd" && Boolean(uscdComparisonProduct?.productId) });
  const selectedCount = supplier === "woodoo" ? woodooLines.reduce((sum, item) => sum + item.quantity, 0) : uscdLines.reduce((sum, item) => sum + item.quantity, 0);
  const wallTrackedLines = useMemo(() => supplier === "woodoo"
    ? woodooLines.map(line => ({ quantity: line.quantity, widthInches: parseLengthInches(line.visual.dimensions ?? line.description), wallAssignments: line.wallAssignments }))
    : uscdLines.map(line => ({ quantity: line.quantity, widthInches: parseLengthInches(line.description), wallAssignments: line.wallAssignments })), [supplier, uscdLines, woodooLines]);
  const selectedRunInches = useMemo(() => wallTrackedLines.reduce((sum, line) => sum + line.widthInches * line.quantity, 0), [wallTrackedLines]);
  const wallRunSummaries = useMemo(() => guidedWallRunSummaries(guidedInputs, wallTrackedLines), [guidedInputs, wallTrackedLines]);
  const unassignedCabinetCount = useMemo(() => wallTrackedLines.reduce((sum, line) => sum + unassignedGuidedCabinetQuantity(line), 0), [wallTrackedLines]);
  const panelRule = guidedPanelGuidanceForSupplier(supplier);

  const woodooFamilies = useMemo(() => {
    const filtered = (woodooCatalog.data ?? []).filter(item => woodooGroup === "all" || woodooQuickGroupForCategory(item.category) === woodooGroup);
    const byCategory = new Map<string, CatalogItem[]>();
    filtered.forEach(item => byCategory.set(item.category, [...(byCategory.get(item.category) ?? []), item]));
    return Array.from(byCategory.entries()).map(([category, items]) => {
      const sizes = [...items].sort((left, right) => sizeSortValue(left) - sizeSortValue(right) || left.productCode.localeCompare(right.productCode));
      const representative = sizes.find(item => item.visual.visual) ?? sizes[0];
      return { category, label: woodooStyleFamilyLabel(category), sizes, representative };
    }).sort((left, right) => left.label.localeCompare(right.label));
  }, [woodooCatalog.data, woodooGroup]);

  const uscdFamilies = useMemo(() => {
    const byLayout = new Map<string, UsCdCatalogItem[]>();
    (uscdCatalog.data ?? []).forEach(item => {
      const key = uscdLayoutFamilyKey(item);
      byLayout.set(key, [...(byLayout.get(key) ?? []), item]);
    });
    return Array.from(byLayout.values()).map(items => {
      const sizes = [...items].sort((left, right) => sizeSortValue({ productCode: left.baseSku, visual: left.visual } as CatalogItem) - sizeSortValue({ productCode: right.baseSku, visual: right.visual } as CatalogItem) || left.baseSku.localeCompare(right.baseSku));
      const representative = sizes.find(item => item.visual.visual) ?? sizes[0];
      return { key: uscdLayoutFamilyKey(representative), label: uscdLayoutFamilyLabel(representative), sizes, representative };
    }).sort((left, right) => left.label.localeCompare(right.label));
  }, [uscdCatalog.data]);

  const addWoodoo = (item: CatalogItem) => setWoodooLines(current => {
    const found = current.find(line => line.priceId === item.priceId);
    return found ? current.map(line => line.priceId === item.priceId ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { ...item, quantity: 1, wallAssignments: [] }];
  });
  const addUsCd = (item: UsCdCatalogItem) => setUsCdLines(current => {
    const found = current.find(line => line.productId === item.productId);
    return found ? current.map(line => line.productId === item.productId ? { ...line, quantity: line.quantity + 1 } : line) : [...current, { productId: item.productId, baseSku: item.baseSku, description: item.description, productGroup: item.productGroup, finishName: item.finishName, unitPriceCents: item.unitPriceCents, quantity: 1, assemblyModsNote: "", addonEachCents: 0, wallAssignments: [] }];
  });
  const updateWoodoo = (priceId: number, delta: number) => setWoodooLines(current => current.map(line => line.priceId === priceId ? (() => { const quantity = Math.max(1, line.quantity + delta); return { ...line, quantity, wallAssignments: normalizeGuidedWallAssignments(line.wallAssignments, quantity) }; })() : line));
  const updateUsCd = (productId: number, delta: number) => setUsCdLines(current => current.map(line => line.productId === productId ? (() => { const quantity = Math.max(1, line.quantity + delta); return { ...line, quantity, wallAssignments: normalizeGuidedWallAssignments(line.wallAssignments, quantity) }; })() : line));
  const addWallAssignment = <T extends { quantity: number; wallAssignments: GuidedCabinetWallAssignment[] }>(line: T) => {
    const wallId = guidedInputs.rooms[0]?.id;
    if (!wallId) return line;
    if (unassignedGuidedCabinetQuantity(line) === 0) return line;
    return { ...line, wallAssignments: [...line.wallAssignments, { wallId, quantity: 1 }] };
  };
  const assignWoodoo = (priceId: number) => setWoodooLines(current => current.map(line => line.priceId === priceId ? addWallAssignment(line) : line));
  const assignUsCd = (productId: number) => setUsCdLines(current => current.map(line => line.productId === productId ? addWallAssignment(line) : line));
  const changeWoodooAssignment = (priceId: number, index: number, patch: Partial<GuidedCabinetWallAssignment>) => setWoodooLines(current => current.map(line => line.priceId === priceId ? { ...line, wallAssignments: updateGuidedWallAssignment(line.wallAssignments, index, patch, line.quantity) } : line));
  const changeUsCdAssignment = (productId: number, index: number, patch: Partial<GuidedCabinetWallAssignment>) => setUsCdLines(current => current.map(line => line.productId === productId ? { ...line, wallAssignments: updateGuidedWallAssignment(line.wallAssignments, index, patch, line.quantity) } : line));
  const removeWoodooAssignment = (priceId: number, index: number) => setWoodooLines(current => current.map(line => line.priceId === priceId ? { ...line, wallAssignments: line.wallAssignments.filter((_, assignmentIndex) => assignmentIndex !== index) } : line));
  const removeUsCdAssignment = (productId: number, index: number) => setUsCdLines(current => current.map(line => line.productId === productId ? { ...line, wallAssignments: line.wallAssignments.filter((_, assignmentIndex) => assignmentIndex !== index) } : line));
  const toggleWorkflowCheck = (stepId: string) => setWorkflowChecks(current => ({ ...current, [stepId]: !current[stepId] }));
  const openGallery = () => { setMode("gallery"); window.setTimeout(() => document.getElementById("cabinet-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const openChecklist = () => { setMode("checklist"); window.setTimeout(() => document.getElementById("layout-review")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const nextStage = nextGuidedStage(mode, selectedCount);
  const workflowBlocked = nextStage.requiresCabinet || (nextStage.target !== "gallery" && unassignedCabinetCount > 0);

  function advanceWorkflow() {
    if (nextStage.requiresCabinet) return toast.error("Add at least one cabinet body before moving to the next step.");
    if (nextStage.target !== "gallery" && unassignedCabinetCount > 0) return toast.error("Assign every selected cabinet body to a wall before moving to the review stage.");
    if (nextStage.target === "gallery") return openGallery();
    if (nextStage.target === "checklist") return openChecklist();
    continueToOrder();
  }

  function continueToOrder() {
    if (!selectedCount) return toast.error("Choose at least one pictured cabinet to continue.");
    if (unassignedCabinetCount > 0) return toast.error("Assign every selected cabinet body to a wall before finalizing the order.");
    if (supplier === "woodoo") {
      sessionStorage.setItem("woodoo-pending-items", JSON.stringify(woodooLines));
      setLocation("/orders/new");
    } else {
      sessionStorage.setItem("uscd-pending-items", JSON.stringify(buildUsCdQuickSelectionPayload(uscdFinishId ?? 0, uscdLines)));
      setLocation("/uscd");
    }
  }

  const isLoading = supplier === "woodoo" ? woodooCatalog.isLoading : uscdCatalog.isLoading;
  const isError = supplier === "woodoo" ? woodooCatalog.isError : uscdCatalog.isError;

  return <DashboardLayout><div className="mx-auto max-w-7xl space-y-6">
    <section className="overflow-hidden rounded-3xl border border-[#dfe7dc] bg-[#eff5ed] p-6 lg:p-8"><div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><div><p className="woodoo-kicker">Guided cabinet selection</p><h1 className="mt-2 font-serif text-4xl tracking-tight">Choose by <em>picture</em>, not by code.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#506257]">Plan each wall first, assign pictured cabinet bodies to that wall, then use live wall totals to review clearances, finish pieces, and approval checkpoints. Every price remains tied to the active supplier configuration.</p><details className="mt-5 max-w-2xl rounded-2xl border border-[#cbd9c9] bg-white/70 p-4"><summary className="cursor-pointer text-sm font-semibold">Need help? Open the 15-step ordering walkthrough</summary><ol className="mt-3 grid gap-2 text-sm leading-5 text-[#596a60] sm:grid-cols-2"><li><b>1.</b> Add project inputs, rooms, walls, and appliance openings.</li><li><b>2.</b> Add cabinet bodies left to right and assign them to walls.</li><li><b>3.</b> Check each wall total and its clearances.</li><li><b>4.</b> Add supplier-appropriate panels, trim, and accessories.</li><li><b>5.</b> Apply supplier rules and compare the takeoff.</li><li><b>6.</b> Resolve discrepancies and obtain final approval.</li></ol></details></div><div className="rounded-2xl border border-[#cbd9c9] bg-white p-5"><p className="woodoo-kicker">Ready-to-use paths</p><div className="mt-3 space-y-2">{(Object.keys(MODE_COPY) as Mode[]).map(key => { const option = MODE_COPY[key]; const Icon = option.icon; return <button key={key} onClick={() => setMode(key)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${mode === key ? "border-[#0d3b26] bg-[#e7f0e7]" : "border-[#e2ded2] hover:bg-[#fafaf7]"}`}><Icon size={18} className="mt-0.5 text-[#0d3b26]" /><span><span className="block text-sm font-semibold">{option.title}{key === "guided" ? " · recommended" : ""}</span><span className="mt-1 block text-xs leading-5 text-[#69796f]">{option.detail}</span></span></button>; })}</div></div></div></section>

    {mode === "guided" && <GuidedOrderWorkflow inputs={guidedInputs} checks={workflowChecks} selectedCabinetCount={selectedCount} selectedRunInches={selectedRunInches} unassignedCabinetCount={unassignedCabinetCount} wallRunSummaries={wallRunSummaries} supplier={supplier} onInputsChange={setGuidedInputs} onToggle={toggleWorkflowCheck} onOpenGallery={openGallery} onOpenChecklist={openChecklist} />}

    <section className="woodoo-card p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="woodoo-kicker">01 · Supplier</p><h2 className="mt-1 text-xl font-semibold">Which cabinet line are you selecting?</h2></div><div className="inline-flex rounded-xl border border-[#dfdbd0] bg-[#fbfaf5] p-1"><button onClick={() => setSupplier("woodoo")} className={`rounded-lg px-4 py-2 text-xs font-bold ${supplier === "woodoo" ? "bg-[#0d3b26] text-white" : "text-[#647168]"}`}>Woodoo MSRP</button><button onClick={() => setSupplier("uscd")} className={`rounded-lg px-4 py-2 text-xs font-bold ${supplier === "uscd" ? "bg-[#0d3b26] text-white" : "text-[#647168]"}`}>U.S. Cabinet Depot</button></div></div>{supplier === "woodoo" ? <div className="mt-5 space-y-4"><div className="grid gap-3 md:grid-cols-[1.45fr_1fr_1fr]"><div><p className="woodoo-label">Room</p><div className="mt-2 flex flex-wrap gap-2">{GUIDED_ROOM_OPTIONS.map(room => <button key={room} onClick={() => setWoodooRoom(room)} className={`rounded-full border px-3 py-2 text-xs font-bold ${woodooRoom === room ? "border-[#0d3b26] bg-[#0d3b26] text-white" : "border-[#d9ded8] bg-white text-[#516158] hover:bg-[#f3f7f1]"}`}>{room}</button>)}</div></div><label className="woodoo-label">Door style<select value={woodooDoor} onChange={event => setWoodooDoor(event.target.value as DoorStyle)} className="woodoo-input mt-2">{DOOR_STYLES.map(value => <option key={value}>{value}</option>)}</select></label><label className="woodoo-label">Finish color<select value={woodooFinish} onChange={event => setWoodooFinish(event.target.value as FinishColor)} className="woodoo-input mt-2">{FINISH_COLORS.map(value => <option key={value}>{value}</option>)}</select></label></div><div><p className="woodoo-label">Cabinet group</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setWoodooGroup("all")} className={`rounded-full border px-3 py-2 text-xs font-bold ${woodooGroup === "all" ? "border-[#0d3b26] bg-[#0d3b26] text-white" : "border-[#d9ded8] bg-white text-[#516158] hover:bg-[#f3f7f1]"}`}>All cabinet groups</button>{WOODOO_QUICK_GROUPS.map(group => <button key={group.id} onClick={() => setWoodooGroup(group.id)} className={`rounded-full border px-3 py-2 text-xs font-bold ${woodooGroup === group.id ? "border-[#0d3b26] bg-[#0d3b26] text-white" : "border-[#d9ded8] bg-white text-[#516158] hover:bg-[#f3f7f1]"}`}>{group.label}</button>)}</div></div></div> : <div className="mt-5 grid gap-3 md:grid-cols-2"><label className="woodoo-label">Finish<select value={uscdFinishId ?? ""} onChange={event => setUsCdFinishId(Number(event.target.value))} className="woodoo-input mt-2">{finishes.data?.map(item => <option key={item.id} value={item.id}>{item.finishName}</option>)}</select></label><label className="woodoo-label">Cabinet group<select value={uscdGroup} onChange={event => setUsCdGroup(event.target.value)} className="woodoo-input mt-2"><option value="">Show all groups</option>{groups.data?.map(item => <option key={item}>{item}</option>)}</select></label></div>}</section>

    {mode === "checklist" && <div id="layout-review"><LayoutReviewChecklist checks={workflowChecks} selectedCabinetCount={selectedCount} supplier={supplier} wallRunSummaries={wallRunSummaries} unassignedCabinetCount={unassignedCabinetCount} onToggle={toggleWorkflowCheck} /></div>}

    <div id="cabinet-gallery" className="grid gap-6 pb-24 xl:grid-cols-[minmax(0,1fr)_360px] xl:pb-0"><section className="woodoo-card overflow-hidden"><div className="border-b border-[#e4e0d6] p-5"><p className="woodoo-kicker">{mode === "gallery" ? "Visual gallery · Add products" : mode === "checklist" ? "Product workspace · Add while reviewing" : "04 · Cabinet bodies · Add left to right"}</p><h2 className="mt-1 text-xl font-semibold">Choose a layout, then add the right size.</h2><p className="mt-1 text-xs leading-5 text-[#748177]">Similar layouts stay together; every size button adds the exact source SKU and active supplier price. After adding a cabinet body, assign it to a wall in the selected-cabinet panel.</p><p className="mt-3 rounded-lg bg-[#f7faf5] px-3 py-2 text-xs font-semibold text-[#48614f]">Panel rule: {panelRule.summary}</p></div>{supplier === "woodoo" && comparisonProduct && <div className="border-b border-[#e4e0d6] bg-[#f7faf5] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="woodoo-kicker">Same-layout price comparison</p><h3 className="mt-1 text-base font-semibold">{comparisonProduct.visual.dimensions ?? comparisonProduct.productCode} · {comparisonProduct.description}</h3><p className="mt-1 text-xs text-[#65756b]">Compare the exact cabinet layout across Woodoo door styles and finishes, then add the preferred source-priced configuration.</p></div><button onClick={() => setComparisonProduct(undefined)} className="text-xs font-bold text-[#516158] underline">Close</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{sourceStyleComparisonRows(layoutStyleComparison.data ?? []).map(item => <div key={item.priceId} className="rounded-xl border border-[#dbe5d8] bg-white p-3"><p className="text-xs font-semibold">{item.doorStyle} · {item.finishColor}</p><p className="mt-2 font-mono text-lg font-bold">{money(item.unitPriceCents)}</p><Button size="sm" className="mt-3 w-full" onClick={() => addWoodoo(item)}>Add this style</Button></div>)}{layoutStyleComparison.isLoading && <p className="text-sm text-[#748177]">Loading source style prices…</p>}</div></div>}{supplier === "uscd" && uscdComparisonProduct && <div className="border-b border-[#e4e0d6] bg-[#f7faf5] p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="woodoo-kicker">Same-layout price comparison</p><h3 className="mt-1 text-base font-semibold">{uscdComparisonProduct.visual.dimensions ?? uscdComparisonProduct.baseSku} · {uscdLayoutFamilyLabel(uscdComparisonProduct)}</h3><p className="mt-1 text-xs text-[#65756b]">Compare this exact U.S. Cabinet Depot layout across available door styles and use one style for the active package.</p></div><button onClick={() => setUsCdComparisonProduct(undefined)} className="text-xs font-bold text-[#516158] underline">Close</button></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{uscdLayoutStyleComparison.data?.map(item => <div key={item.priceId} className={`rounded-xl border p-3 ${item.finishId === uscdFinishId ? "border-[#0d3b26] bg-[#eff5ed]" : "border-[#dbe5d8] bg-white"}`}><p className="text-xs font-semibold">{item.finishName}</p><p className="mt-2 font-mono text-lg font-bold">{money(item.unitPriceCents)}</p><Button size="sm" variant={item.finishId === uscdFinishId ? "outline" : "default"} className="mt-3 w-full" onClick={() => { setUsCdFinishId(item.finishId); setUsCdComparisonProduct(undefined); }}>Use this style</Button></div>)}{uscdLayoutStyleComparison.isLoading && <p className="text-sm text-[#748177]">Loading source style prices…</p>}</div></div>}{supplier === "woodoo" ? <div className="grid gap-4 p-5 md:grid-cols-2">{woodooFamilies.map(family => <article key={family.category} className="overflow-hidden rounded-2xl border border-[#e4e0d6] bg-[#fffefa]"><div className="flex gap-3 border-b border-[#ece8df] p-4"><VisualCabinetImage detail={family.representative.visual} label={family.representative.productCode} /><div className="min-w-0"><p className="text-sm font-semibold leading-5">{family.label}</p><p className="mt-1 text-[11px] leading-4 text-[#6c7a71]">{family.representative.visual.helperText}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#718076]">{family.sizes.length} source-priced size{family.sizes.length === 1 ? "" : "s"}</p><button onClick={() => setComparisonProduct(family.representative)} className="text-[10px] font-bold text-[#0d3b26] underline">Compare styles</button></div></div></div><div className="max-h-72 divide-y divide-[#eeeadf] overflow-y-auto">{family.sizes.map(item => <button key={item.priceId} onClick={() => addWoodoo(item)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#eff5ed]"><span className="min-w-0"><span className="block font-mono text-[11px] font-bold text-[#0d3b26]">{woodooQuickSizeLabel(item)}</span><span className="mt-0.5 block truncate text-[10px] text-[#748177]">{item.productCode}</span></span><span className="shrink-0 text-right"><span className="block font-mono text-sm font-bold">{money(item.unitPriceCents)}</span><span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#0d3b26]"><Plus size={11} /> Add</span></span></button>)}</div></article>)}{isLoading && <div className="col-span-full p-10 text-center text-sm text-[#748177]">Loading grouped cabinet styles…</div>}{isError && <div className="col-span-full p-10 text-center text-sm text-red-700">The Woodoo catalog could not be loaded.</div>}{!isLoading && !isError && woodooFamilies.length === 0 && <div className="col-span-full p-10 text-center text-sm text-[#748177]">No cabinet styles match these filters. Change the room, group, door style, or finish.</div>}</div> : <div className="grid gap-4 p-5 md:grid-cols-2">{uscdFamilies.map(family => <article key={family.key} className="overflow-hidden rounded-2xl border border-[#e4e0d6] bg-[#fffefa]"><div className="flex gap-3 border-b border-[#ece8df] p-4"><VisualCabinetImage detail={family.representative.visual} label={family.representative.orderSku} /><div className="min-w-0"><p className="text-sm font-semibold leading-5">{family.label}</p><p className="mt-1 text-[11px] leading-4 text-[#6c7a71]">{family.representative.visual.helperText}</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#718076]">{family.sizes.length} source-priced size{family.sizes.length === 1 ? "" : "s"}</p><button onClick={() => setUsCdComparisonProduct(family.representative)} className="text-[10px] font-bold text-[#0d3b26] underline">Compare styles</button></div></div></div><div className="max-h-72 divide-y divide-[#eeeadf] overflow-y-auto">{family.sizes.map(item => <button key={item.priceId} onClick={() => addUsCd(item)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-[#eff5ed]"><span className="min-w-0"><span className="block font-mono text-[11px] font-bold text-[#0d3b26]">{uscdQuickSizeLabel(item)}</span><span className="mt-0.5 block truncate text-[10px] text-[#748177]">{item.orderSku}</span></span><span className="shrink-0 text-right"><span className="block font-mono text-sm font-bold">{money(item.unitPriceCents)}</span><span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#0d3b26]"><Plus size={11} /> Add</span></span></button>)}</div></article>)}{isLoading && <div className="col-span-full p-10 text-center text-sm text-[#748177]">Loading grouped cabinet layouts…</div>}{isError && <div className="col-span-full p-10 text-center text-sm text-red-700">The supplier catalog could not be loaded.</div>}{!isLoading && !isError && uscdFamilies.length === 0 && <div className="col-span-full p-10 text-center text-sm text-[#748177]">No cabinet layouts match these choices. Change the finish or group.</div>}</div>}</section>
      <aside className="h-fit overflow-hidden woodoo-card xl:sticky xl:top-24"><div className="border-b border-[#e4e0d6] p-5"><p className="woodoo-kicker">03 · Selected</p><h2 className="mt-1 text-xl font-semibold">Assign cabinets to walls</h2><p className="mt-1 text-xs leading-5 text-[#718076]">Place every cabinet body on its actual wall. The wall total updates as each placement is added.</p><p className="mt-3 rounded-xl bg-[#f7faf5] p-3 text-[11px] font-semibold leading-5 text-[#48614f]">{panelRule.summary}</p></div><div className="max-h-[620px] divide-y divide-[#ece8df] overflow-y-auto">{supplier === "woodoo" ? woodooLines.map(line => <div key={line.priceId} className="p-4"><div className="flex items-center gap-3"><VisualCabinetImage detail={line.visual} label={line.productCode} size="small" /><div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold text-[#0d3b26]">{line.productCode}</p><p className="mt-1 line-clamp-2 text-xs font-medium">{line.description}</p><p className="mt-1 text-xs font-bold">{money(line.unitPriceCents * line.quantity)}</p></div><div className="flex items-center gap-1"><button className="quantity-button" onClick={() => updateWoodoo(line.priceId, -1)}><Minus size={12} /></button><span className="w-5 text-center text-xs font-bold">{line.quantity}</span><button className="quantity-button" onClick={() => updateWoodoo(line.priceId, 1)}><Plus size={12} /></button></div></div><WallAssignmentControls quantity={line.quantity} assignments={line.wallAssignments} walls={guidedInputs.rooms} onAssignOne={() => assignWoodoo(line.priceId)} onUpdate={(index, patch) => changeWoodooAssignment(line.priceId, index, patch)} onRemove={index => removeWoodooAssignment(line.priceId, index)} /></div>) : uscdLines.map(line => <div key={line.productId} className="p-4"><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="font-mono text-[10px] font-bold text-[#0d3b26]">{line.baseSku}</p><p className="mt-1 line-clamp-2 text-xs font-medium">{line.description}</p><p className="mt-1 text-xs font-bold">{typeof line.unitPriceCents === "number" ? money(line.unitPriceCents * line.quantity) : "Source price loading"}</p></div><div className="flex items-center gap-1"><button className="quantity-button" onClick={() => updateUsCd(line.productId, -1)}><Minus size={12} /></button><span className="w-5 text-center text-xs font-bold">{line.quantity}</span><button className="quantity-button" onClick={() => updateUsCd(line.productId, 1)}><Plus size={12} /></button></div></div><WallAssignmentControls quantity={line.quantity} assignments={line.wallAssignments} walls={guidedInputs.rooms} onAssignOne={() => assignUsCd(line.productId)} onUpdate={(index, patch) => changeUsCdAssignment(line.productId, index, patch)} onRemove={index => removeUsCdAssignment(line.productId, index)} /></div>)}{selectedCount === 0 && <div className="p-8 text-center text-sm leading-6 text-[#748177]">Choose a pictured cabinet to start your package.</div>}</div><div className="bg-[#fbfaf5] p-5"><Button onClick={advanceWorkflow} disabled={workflowBlocked} className="w-full bg-[#0d3b26] hover:bg-[#12462d]">{nextStage.label}<ArrowRight size={15} /></Button><p className="mt-3 text-center text-[11px] text-[#718076]">{selectedCount} cabinet{selectedCount === 1 ? "" : "s"} selected · {unassignedCabinetCount ? `${unassignedCabinetCount} unassigned` : "all assigned"}</p></div></aside>
    </div>
    <div className="fixed inset-x-4 bottom-4 z-40 rounded-2xl border border-[#cbd9c9] bg-[#0d3b26] p-3 shadow-xl xl:hidden"><div className="flex items-center gap-3"><div className="min-w-0 flex-1 text-white"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#dce9d8]">Cabinet start</p><p className="mt-0.5 text-sm font-semibold">{selectedCount} cabinet{selectedCount === 1 ? "" : "s"} · {unassignedCabinetCount ? `${unassignedCabinetCount} unassigned` : "all assigned"}</p></div><Button size="sm" onClick={advanceWorkflow} disabled={workflowBlocked} className="bg-[#f1dc75] text-[#173423] hover:bg-[#f7e589]">Next<ArrowRight size={15} /></Button></div></div>
  </div></DashboardLayout>;
}
