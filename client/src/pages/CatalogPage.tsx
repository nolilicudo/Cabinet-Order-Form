import { CatalogBrowser } from "@/components/CatalogBrowser";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "@/lib/woodoo";
import { FilePlus2, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CatalogPage() {
  const [, setLocation] = useLocation();
  const start = (item: CatalogItem) => { sessionStorage.setItem("woodoo-pending-items", JSON.stringify([{ ...item, quantity: 1 }])); toast.success(`${item.productCode} added to a new draft.`); setLocation("/orders/new"); };
  return <DashboardLayout><div className="mx-auto max-w-7xl"><div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="woodoo-kicker">Source reference</p><h1 className="mt-2 font-serif text-4xl tracking-tight">Woodoo Cabinet Catalog</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66756b]">Browse imported MSRP configurations by room, door style, finish color, product code, or cabinet description.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setLocation("/quick-select")} className="gap-2"><WandSparkles size={16} />Quick select</Button><Button onClick={() => setLocation("/orders/new")} className="gap-2 bg-[#0d3b26] hover:bg-[#12462d]"><FilePlus2 size={16} />Start an order</Button></div></div><CatalogBrowser onAdd={start} addLabel="Add to new order" limit={120} /></div></DashboardLayout>;
}
