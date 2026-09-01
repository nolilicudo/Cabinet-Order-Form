import { Box } from "lucide-react";

type VisualDetail = {
  visual: { sheetUrl: string; x: number; y: number; width: number; height: number } | null;
  dimensions: string | null;
  cabinetType: string;
  helperText: string;
};

export function VisualCabinetImage({ detail, label, size = "regular" }: { detail?: VisualDetail | null; label: string; size?: "small" | "regular" }) {
  const box = size === "small" ? { width: 72, height: 78 } : { width: 110, height: 112 };
  const visual = detail?.visual;
  if (!visual) {
    return <div style={box} className="grid shrink-0 place-items-center rounded-xl border border-dashed border-[#d8d3c7] bg-[#f8f7f1] text-[#98a197]" aria-label={`${label} layout image unavailable`}><Box size={size === "small" ? 20 : 28} /></div>;
  }
  const scale = Math.min(box.width / visual.width, box.height / visual.height);
  return <div style={box} className="shrink-0 overflow-hidden rounded-xl border border-[#e1ddd2] bg-white" aria-label={`${label} cabinet layout`}>
    <div style={{
      width: visual.width,
      height: visual.height,
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      backgroundImage: `url(${visual.sheetUrl})`,
      backgroundPosition: `-${visual.x}px -${visual.y}px`,
      backgroundRepeat: "no-repeat",
    }} />
  </div>;
}
