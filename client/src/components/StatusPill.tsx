import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/woodoo";

const tone: Record<OrderStatus, string> = { Draft: "border-stone-200 bg-stone-100 text-stone-700", Verified: "border-amber-200 bg-amber-50 text-amber-800", Submitted: "border-emerald-200 bg-emerald-50 text-emerald-800" };

export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[.12em]", tone[status], className)}>{status}</span>;
}
