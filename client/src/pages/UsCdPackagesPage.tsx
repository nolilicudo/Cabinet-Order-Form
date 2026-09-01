import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Copy, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function UsCdPackagesPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const packages = trpc.uscd.packages.useQuery();
  const duplicatePackage = trpc.uscd.duplicatePackage.useMutation({
    onSuccess: data => { toast.success("Draft package duplicated."); utils.uscd.packages.invalidate(); setLocation(`/uscd/${data.package.id}`); },
    onError: error => toast.error(error.message),
  });
  const deletePackage = trpc.uscd.deletePackage.useMutation({
    onSuccess: () => { toast.success("U.S. Cabinet Depot package deleted."); utils.uscd.packages.invalidate(); },
    onError: error => toast.error(error.message),
  });

  return <DashboardLayout><div className="mx-auto max-w-6xl space-y-6">
    <section className="woodoo-card flex flex-col justify-between gap-4 p-7 sm:flex-row sm:items-end"><div><p className="woodoo-kicker">U.S. Cabinet Depot · Capital Framed</p><h1 className="mt-2 font-serif text-4xl tracking-tight">Saved customer packages</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66756b]">Reopen, revise, duplicate, or safely remove customer package comparisons.</p></div><Button onClick={() => setLocation("/uscd")} className="bg-[#0d3b26] hover:bg-[#12462d]"><Plus size={15} />New package</Button></section>
    {packages.isLoading && <div className="woodoo-card p-10 text-center text-sm text-[#66756b]">Loading saved packages…</div>}
    {packages.isError && <div className="woodoo-card border-red-200 p-10 text-center text-sm text-red-800">Saved packages could not be loaded.</div>}
    {packages.data?.length === 0 && <div className="woodoo-card p-12 text-center"><FolderOpen className="mx-auto text-[#78917f]" size={30} /><h2 className="mt-4 text-lg font-semibold">No saved U.S. Cabinet Depot packages yet</h2><p className="mt-2 text-sm text-[#69796e]">Build your first package to create a customer-ready finish comparison.</p></div>}
    <div className="grid gap-4 md:grid-cols-2">{packages.data?.map(item => <section key={item.id} className="woodoo-card overflow-hidden"><div className="border-b border-[#e5e0d4] bg-[#fbfaf5] p-5"><div className="flex justify-between gap-3"><div><p className="font-mono text-xs font-bold text-[#0d3b26]">{item.estimateNumber}</p><h2 className="mt-1 text-lg font-semibold">{item.customerName}</h2><p className="mt-1 text-xs text-[#718076]">{item.itemCount} cabinet{item.itemCount === 1 ? "" : "s"} · Updated {new Date(item.updatedAt).toLocaleDateString()}</p></div><p className="font-mono text-lg font-bold">{money(item.totalCents)}</p></div></div><div className="grid gap-2 p-4 sm:grid-cols-3"><Button size="sm" variant="outline" onClick={() => setLocation(`/uscd/${item.id}`)}><Pencil size={14} />Edit</Button><Button size="sm" variant="outline" disabled={duplicatePackage.isPending} onClick={() => duplicatePackage.mutate({ packageId: item.id })}><Copy size={14} />Duplicate</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"><Trash2 size={14} />Delete</Button></AlertDialogTrigger><AlertDialogContent className="bg-white"><AlertDialogHeader><AlertDialogTitle>Delete this customer package?</AlertDialogTitle><AlertDialogDescription>This permanently removes {item.estimateNumber}, its freight inputs, and all cabinet line items. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-700 hover:bg-red-800" onClick={() => deletePackage.mutate({ packageId: item.id })}>Delete package</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></section>)}</div>
  </div></DashboardLayout>;
}
