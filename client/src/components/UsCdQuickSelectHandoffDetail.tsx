import React from "react";
import { uscdQuickSelectionSourceDetail } from "@/lib/woodoo";

type HandoffLine = {
  baseSku: string;
  finishName?: string;
  unitPriceCents?: number;
};

export function UsCdQuickSelectHandoffDetail({ line }: { line: HandoffLine }) {
  if (!line.finishName || typeof line.unitPriceCents !== "number") return null;

  return (
    <p className="mt-1 text-[10px] font-semibold text-[#3d6750]" data-testid="uscd-quick-select-handoff">
      Quick Select handoff · {uscdQuickSelectionSourceDetail(line)}
    </p>
  );
}
