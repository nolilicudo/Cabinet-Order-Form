import { BookOpen, Boxes, FileText, LayoutDashboard, Menu, PackagePlus, Plus, Ruler, Scale, WandSparkles, X } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const navItems = [
  { label: "Orders", subtitle: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Quick select", subtitle: "Choose by picture", path: "/quick-select", icon: WandSparkles },
  { label: "New order", subtitle: "Build request", path: "/orders/new", icon: PackagePlus },
  { label: "Cabinet catalog", subtitle: "Woodoo MSRP", path: "/catalog", icon: BookOpen },
  { label: "USCD package", subtitle: "Finish comparison", path: "/uscd", icon: Scale },
  { label: "Custom cabinets", subtitle: "Sequoia & RA", path: "/custom-cabinets", icon: Boxes },
  { label: "Countertops", subtitle: "MSI & Cosentino", path: "/countertops", icon: Ruler },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const navigate = (path: string) => { setLocation(path); setOpen(false); };

  return <div className="min-h-screen bg-[#f6f4ed] text-[#17291f]">
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-white/10 bg-[#082f1d] text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#ead48d] text-[#082f1d]"><FileText size={18} /></div><div><div className="text-sm font-bold tracking-tight">Woodoo Orders</div><div className="text-[10px] uppercase tracking-[0.18em] text-white/55">Design Your Price</div></div><button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X size={18} /></button></div>
      <nav className="flex-1 px-3 py-6"><p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Workspace</p>{navItems.map(item => { const active = item.path === "/" ? location === "/" : location === item.path || location.startsWith(`${item.path}/`); const Icon = item.icon; return <button key={item.path} onClick={() => navigate(item.path)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? "bg-[#ead48d] text-[#17291f]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}><Icon size={18} /><span><span className="block text-sm font-medium">{item.label}</span><span className={`block text-[10px] ${active ? "text-[#17291f]/55" : "text-white/45"}`}>{item.subtitle}</span></span></button>; })}</nav>
      <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs font-bold">DY</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">Design Your Price</p><p className="truncate text-[10px] text-white/45">Woodoo operations</p></div></div></div>
    </aside>
    <div className="lg:pl-[250px]"><header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#e2ded2] bg-[#f6f4ed]/95 px-5 backdrop-blur lg:px-7"><div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#e1ddd1] bg-white lg:hidden"><Menu size={19} /></button><div><p className="woodoo-kicker">Operations</p><p className="text-sm font-semibold">Cabinet ordering</p></div></div><div className="flex items-center gap-2"><label className="hidden sm:block"><span className="sr-only">Workspace supplier</span><select aria-label="Workspace supplier" value={location.startsWith("/countertops") ? "countertops" : location.startsWith("/uscd") ? "uscd" : location.startsWith("/custom-cabinets") ? "custom" : "woodoo"} onChange={event => navigate(event.target.value === "countertops" ? "/countertops" : event.target.value === "uscd" ? "/uscd" : event.target.value === "custom" ? "/custom-cabinets" : "/orders/new")} className="h-9 rounded-full border border-[#e1ddd1] bg-white px-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[#526159 outline-none"><option value="woodoo">Woodoo MSRP</option><option value="uscd">U.S. Cabinet Depot</option><option value="custom">Sequoia / RA custom</option><option value="countertops">MSI / Cosentino tops</option></select></label><span className="hidden rounded-full border border-[#e1ddd1] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#657269] xl:inline">MSRP controlled</span><Button onClick={() => navigate("/orders/new")} className="gap-2 bg-[#0d3b26] hover:bg-[#12462d]"><Plus size={16} />New order</Button></div></header><main className="min-h-[calc(100vh-5rem)] px-5 py-8 lg:px-7">{children}</main></div>
  </div>;
}
