import { Button } from "@/components/ui/button";
import {
  type GuidedApplianceOpening,
  type GuidedAppliancePresetId,
  type GuidedCabinetSupplier,
  type GuidedProjectInputs,
  type GuidedRoomWall,
  type GuidedWallRunSummary,
  GUIDED_APPLIANCE_PRESETS,
  GUIDED_ORDER_STEPS,
  GUIDED_ROOM_OPTIONS,
  applyGuidedAppliancePreset,
  appliancePreset,
  createGuidedApplianceOpening,
  formatFeetAndInches,
  guidedPanelGuidanceForSupplier,
  plannedWallRunInches,
  workflowCompleteCount,
} from "@/lib/guidedOrderWorkflow";
import { CheckCircle2, ChevronRight, ClipboardList, Plus, Trash2 } from "lucide-react";

type Props = {
  inputs: GuidedProjectInputs;
  checks: Record<string, boolean>;
  selectedCabinetCount: number;
  selectedRunInches: number;
  unassignedCabinetCount: number;
  wallRunSummaries: GuidedWallRunSummary[];
  supplier: GuidedCabinetSupplier;
  onInputsChange: (inputs: GuidedProjectInputs) => void;
  onToggle: (stepId: string) => void;
  onOpenGallery: () => void;
  onOpenChecklist: () => void;
};

function updateRoom(inputs: GuidedProjectInputs, id: string, field: keyof GuidedRoomWall, value: string) {
  return { ...inputs, rooms: inputs.rooms.map(room => room.id === id ? { ...room, [field]: value } : room) };
}

function updateAppliance(inputs: GuidedProjectInputs, id: string, field: keyof GuidedApplianceOpening, value: string) {
  return { ...inputs, appliances: inputs.appliances.map(appliance => appliance.id === id ? { ...appliance, [field]: value } : appliance) };
}

function WallRunRows({ summaries }: { summaries: GuidedWallRunSummary[] }) {
  if (!summaries.length) return <p className="mt-4 rounded-xl bg-[#f7faf5] p-3 text-xs leading-5 text-[#64756b]">Add a room and wall to begin assigning cabinet bodies.</p>;
  return <div className="mt-4 space-y-2">{summaries.map(summary => {
    const hasPlannedRun = summary.plannedInches > 0;
    const balanced = hasPlannedRun && summary.differenceInches === 0;
    const over = hasPlannedRun && summary.differenceInches < 0;
    const status = !hasPlannedRun
      ? "Enter wall length"
      : balanced
        ? "Matched"
        : `${over ? "Over" : "Remaining"} ${formatFeetAndInches(Math.abs(summary.differenceInches))}`;
    return <div key={summary.wallId} className="rounded-xl border border-[#e6e5db] bg-[#fffefa] p-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">{summary.label}</p><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${balanced ? "bg-[#e5f2e6] text-[#0d3b26]" : over ? "bg-[#fff0ed] text-[#9c4438]" : "bg-[#f2f0e8] text-[#66756b]"}`}>{status}</span></div><div className="mt-2 grid grid-cols-2 gap-2 text-[11px]"><span className="text-[#718076]">Planned <b className="font-mono text-[#304238]">{formatFeetAndInches(summary.plannedInches)}</b></span><span className="text-right text-[#718076]">Cabinets <b className="font-mono text-[#304238]">{formatFeetAndInches(summary.assignedInches)}</b></span></div></div>;
  })}</div>;
}

export function GuidedOrderWorkflow({ inputs, checks, selectedCabinetCount, selectedRunInches, unassignedCabinetCount, wallRunSummaries, supplier, onInputsChange, onToggle, onOpenGallery, onOpenChecklist }: Props) {
  const completed = workflowCompleteCount(checks, selectedCabinetCount);
  const plannedRun = plannedWallRunInches(inputs);
  const difference = plannedRun && selectedRunInches ? plannedRun - selectedRunInches : 0;
  const panelRule = guidedPanelGuidanceForSupplier(supplier);

  return <section className="woodoo-card overflow-hidden">
    <div className="border-b border-[#dce6da] bg-[#eff5ed] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="woodoo-kicker">Guided Start · Project to approval</p><h2 className="mt-1 text-2xl font-semibold">Build the cabinet order in the right sequence.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#58695f]">Set the wall runs, place every cabinet body on a wall, and then review supplier-specific finish pieces before final approval.</p></div><div className="rounded-2xl border border-[#c8d8c5] bg-white px-4 py-3 text-right"><p className="text-2xl font-bold text-[#0d3b26]">{completed}/{GUIDED_ORDER_STEPS.length}</p><p className="text-xs font-semibold text-[#65756b]">workflow checks complete</p></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#d7e5d4]"><div className="h-full rounded-full bg-[#0d3b26] transition-all" style={{ width: `${Math.round((completed / GUIDED_ORDER_STEPS.length) * 100)}%` }} /></div></div>

    <div className="grid gap-6 p-5 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-5">
        <div><p className="woodoo-kicker">Steps 1–3 · Project inputs</p><h3 className="mt-1 text-lg font-semibold">Set the room, wall, and appliance constraints first.</h3></div>
        <label className="woodoo-label">Project reference<input value={inputs.projectReference} onChange={event => onInputsChange({ ...inputs, projectReference: event.target.value })} className="woodoo-input mt-2" placeholder="Estimate, homeowner, or project name" /></label>
        <div className="rounded-2xl border border-[#e4e0d6] bg-[#fbfaf5] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Rooms and walls</p><p className="text-xs text-[#718076]">Choose the room type, then enter the usable cabinet run for each wall in feet.</p></div><Button size="sm" variant="outline" onClick={() => onInputsChange({ ...inputs, rooms: [...inputs.rooms, { id: `room-${Date.now()}`, room: "Kitchen", wall: "", lengthFeet: "" }] })}><Plus size={14} /> Add wall</Button></div><div className="mt-3 space-y-2">{inputs.rooms.map(room => <div key={room.id} className="grid gap-2 rounded-xl border border-[#e7e1d7] bg-white p-3 md:grid-cols-[150px_1fr_1fr_100px_auto]"><select className="woodoo-input" value={room.room} onChange={event => onInputsChange(updateRoom(inputs, room.id, "room", event.target.value))}>{GUIDED_ROOM_OPTIONS.map(option => <option key={option}>{option}</option>)}</select>{room.room === "Custom" ? <input className="woodoo-input" value={room.customRoomName ?? ""} onChange={event => onInputsChange(updateRoom(inputs, room.id, "customRoomName", event.target.value))} placeholder="Custom room name" /> : <div className="rounded-lg border border-dashed border-[#dfe4dc] px-3 py-2 text-xs text-[#718076]">{room.room}</div>}<input className="woodoo-input" value={room.wall} onChange={event => onInputsChange(updateRoom(inputs, room.id, "wall", event.target.value))} placeholder="Wall name" /><input className="woodoo-input" inputMode="decimal" value={room.lengthFeet} onChange={event => onInputsChange(updateRoom(inputs, room.id, "lengthFeet", event.target.value))} placeholder="Feet" /><button aria-label="Remove wall" onClick={() => onInputsChange({ ...inputs, rooms: inputs.rooms.filter(entry => entry.id !== room.id) })} className="rounded-lg border border-[#ead8d3] px-2 text-[#a34c40] hover:bg-[#fff3f0]"><Trash2 size={15} /></button></div>)}</div></div>
        <div className="rounded-2xl border border-[#e4e0d6] bg-[#fbfaf5] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Appliance openings</p><p className="text-xs text-[#718076]">Choose a standard starter size, then override width, height, or depth for the manufacturer-specific opening.</p></div><Button size="sm" variant="outline" onClick={() => onInputsChange({ ...inputs, appliances: [...inputs.appliances, createGuidedApplianceOpening(`appliance-${Date.now()}`)] })}><Plus size={14} /> Add appliance</Button></div>{inputs.appliances.length > 0 && <div className="mt-3 space-y-3">{inputs.appliances.map(appliance => { const preset = appliancePreset(appliance.appliance); return <div key={appliance.id} className="rounded-xl border border-[#e7e1d7] bg-white p-3"><div className="grid gap-2 md:grid-cols-[1.35fr_90px_90px_90px_1fr_auto]"><select className="woodoo-input" value={appliance.appliance} onChange={event => onInputsChange({ ...inputs, appliances: inputs.appliances.map(entry => entry.id === appliance.id ? applyGuidedAppliancePreset(entry, event.target.value as GuidedAppliancePresetId) : entry) })}>{GUIDED_APPLIANCE_PRESETS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}</select><input className="woodoo-input" inputMode="decimal" value={appliance.widthInches} onChange={event => onInputsChange(updateAppliance(inputs, appliance.id, "widthInches", event.target.value))} placeholder="W" /><input className="woodoo-input" inputMode="decimal" value={appliance.heightInches} onChange={event => onInputsChange(updateAppliance(inputs, appliance.id, "heightInches", event.target.value))} placeholder="H" /><input className="woodoo-input" inputMode="decimal" value={appliance.depthInches} onChange={event => onInputsChange(updateAppliance(inputs, appliance.id, "depthInches", event.target.value))} placeholder="D" /><input className="woodoo-input" value={appliance.note} onChange={event => onInputsChange(updateAppliance(inputs, appliance.id, "note", event.target.value))} placeholder="Clearance or installation note" /><button aria-label="Remove appliance" onClick={() => onInputsChange({ ...inputs, appliances: inputs.appliances.filter(entry => entry.id !== appliance.id) })} className="rounded-lg border border-[#ead8d3] px-2 text-[#a34c40] hover:bg-[#fff3f0]"><Trash2 size={15} /></button></div><p className="mt-2 text-[11px] text-[#718076]">Starter size: {preset.widthInches || "Custom"}W × {preset.heightInches || "Custom"}H × {preset.depthInches || "Custom"}D · {preset.detail}</p></div>; })}</div>}</div>
        <div className="rounded-2xl border border-[#d6e4d3] bg-[#f7fbf6] p-4"><p className="woodoo-kicker">Panel rule · {supplier === "woodoo" ? "Woodoo" : "U.S. Cabinet Depot"}</p><p className="mt-1 text-sm font-semibold">{panelRule.stepTitle}</p><p className="mt-1 text-xs leading-5 text-[#64756b]">{panelRule.detail}</p></div>
        <div className="flex flex-wrap gap-3"><Button onClick={onOpenGallery}>Next: Add cabinet bodies <ChevronRight size={15} /></Button><Button variant="outline" onClick={onOpenChecklist}><ClipboardList size={15} /> Open review checklist</Button></div>
      </div>
      <div className="rounded-2xl border border-[#dce6da] bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="woodoo-kicker">Order run check</p><h3 className="mt-1 font-semibold">Wall totals at a glance</h3></div><CheckCircle2 className={selectedCabinetCount > 0 ? "text-[#0d3b26]" : "text-[#a8b3a8]"} size={22} /></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#68776d]">Planned wall run</dt><dd className="font-mono font-bold">{formatFeetAndInches(plannedRun)}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#68776d]">Selected cabinet run</dt><dd className="font-mono font-bold">{formatFeetAndInches(selectedRunInches)}</dd></div><div className="flex justify-between gap-4 border-t border-[#edf0eb] pt-3"><dt className="text-[#68776d]">Difference to review</dt><dd className="font-mono font-bold text-[#0d3b26]">{plannedRun && selectedRunInches ? formatFeetAndInches(Math.abs(difference)) : "Add wall + cabinet data"}</dd></div></dl>{unassignedCabinetCount > 0 && <p className="mt-4 rounded-xl bg-[#fff3f0] p-3 text-xs font-semibold leading-5 text-[#9c4438]">{unassignedCabinetCount} cabinet{unassignedCabinetCount === 1 ? " body is" : " bodies are"} not assigned to a wall yet.</p>}<WallRunRows summaries={wallRunSummaries} /><p className="mt-4 rounded-xl bg-[#f7faf5] p-3 text-xs leading-5 text-[#64756b]">Assign each cabinet body to a wall in the selected-cabinet panel. These totals are a review checkpoint, not a substitute for elevation dimensions.</p></div>
    </div>
  </section>;
}

export function LayoutReviewChecklist({ checks, selectedCabinetCount, supplier, wallRunSummaries, unassignedCabinetCount, onToggle }: { checks: Record<string, boolean>; selectedCabinetCount: number; supplier: GuidedCabinetSupplier; wallRunSummaries: GuidedWallRunSummary[]; unassignedCabinetCount: number; onToggle: (stepId: string) => void }) {
  const grouped = ["Plan", "Build", "Verify", "Approve"] as const;
  const panelRule = guidedPanelGuidanceForSupplier(supplier);
  return <section className="woodoo-card p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="woodoo-kicker">Layout checklist · Review while ordering</p><h2 className="mt-1 text-xl font-semibold">Work the order from takeoff to final approval.</h2><p className="mt-1 text-xs leading-5 text-[#718076]">Mark each review item only when it has been checked against the current layout, elevations, and supplier information.</p></div><p className="rounded-full bg-[#eff5ed] px-3 py-2 text-xs font-bold text-[#0d3b26]">{selectedCabinetCount} cabinet{selectedCabinetCount === 1 ? "" : "s"} selected</p></div><div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl border border-[#d6e4d3] bg-[#f7fbf6] p-4"><p className="woodoo-kicker">Supplier panel check</p><p className="mt-1 text-sm font-semibold">{panelRule.stepTitle}</p><p className="mt-1 text-xs leading-5 text-[#64756b]">{panelRule.detail}</p></div><div className="rounded-2xl border border-[#e4e0d6] bg-[#fffefa] p-4"><p className="woodoo-kicker">Assigned cabinet runs</p>{unassignedCabinetCount > 0 && <p className="mt-2 text-xs font-semibold text-[#9c4438]">{unassignedCabinetCount} cabinet{unassignedCabinetCount === 1 ? " body" : " bodies"} still need a wall assignment.</p>}<WallRunRows summaries={wallRunSummaries} /></div></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{grouped.map(section => <div key={section} className="rounded-2xl border border-[#e4e0d6] bg-[#fffefa] p-4"><p className="woodoo-kicker">{section}</p><div className="mt-3 space-y-2">{GUIDED_ORDER_STEPS.filter(step => step.section === section).map(step => { const complete = step.id === "cabinet-bodies" ? selectedCabinetCount > 0 : Boolean(checks[step.id]); const displayStep = step.id === "panels" ? { ...step, title: panelRule.stepTitle, detail: panelRule.detail } : step; return <label key={step.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${complete ? "border-[#cfe0cd] bg-[#eff5ed]" : "border-[#e8e3d9] bg-white hover:bg-[#fafaf7]"}`}><input type="checkbox" checked={complete} disabled={step.id === "cabinet-bodies"} onChange={() => onToggle(step.id)} className="mt-0.5 size-4 accent-[#0d3b26]" /><span><span className="block text-sm font-semibold">{displayStep.title}</span><span className="mt-1 block text-xs leading-5 text-[#6b7a70]">{displayStep.detail}</span></span></label>; })}</div></div>)}</div></section>;
}
