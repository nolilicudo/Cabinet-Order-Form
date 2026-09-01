import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import CatalogPage from "@/pages/CatalogPage";
import CustomCabinetBuilder from "@/pages/CustomCabinetBuilder";
import CustomCabinetPackageView from "@/pages/CustomCabinetPackageView";
import CountertopBuilder from "@/pages/CountertopBuilder";
import CountertopTakeoffView from "@/pages/CountertopTakeoffView";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import OrderEditor from "@/pages/OrderEditor";
import OrderView from "@/pages/OrderView";
import QuickSelectPage from "@/pages/QuickSelectPage";
import UsCdPackageBuilder from "@/pages/UsCdPackageBuilder";
import UsCdPackagesPage from "@/pages/UsCdPackagesPage";
import { Route, Switch, useRoute } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function ExistingOrderEditor() {
  const [, params] = useRoute("/orders/:orderId");
  return <OrderEditor orderId={Number(params?.orderId)} />;
}

function ExistingOrderView() {
  const [, params] = useRoute("/orders/:orderId/view");
  return <OrderView orderId={Number(params?.orderId)} />;
}

function NewOrder() {
  return <OrderEditor />;
}

function ExistingUsCdPackage() {
  const [, params] = useRoute("/uscd/:packageId");
  return <UsCdPackageBuilder packageId={Number(params?.packageId)} />;
}

function ExistingCustomCabinetPackage() {
  const [, params] = useRoute("/custom-cabinets/:packageId");
  return <CustomCabinetPackageView packageId={Number(params?.packageId)} />;
}

function ExistingCountertopTakeoff() {
  const [, params] = useRoute("/countertops/:takeoffId");
  return <CountertopTakeoffView takeoffId={Number(params?.takeoffId)} />;
}

function Router() {
  return <Switch><Route path="/" component={Home} /><Route path="/quick-select" component={QuickSelectPage} /><Route path="/catalog" component={CatalogPage} /><Route path="/countertops/:takeoffId" component={ExistingCountertopTakeoff} /><Route path="/countertops" component={CountertopBuilder} /><Route path="/custom-cabinets/:packageId" component={ExistingCustomCabinetPackage} /><Route path="/custom-cabinets" component={CustomCabinetBuilder} /><Route path="/uscd/packages" component={UsCdPackagesPage} /><Route path="/uscd/:packageId" component={ExistingUsCdPackage} /><Route path="/uscd"><UsCdPackageBuilder /></Route><Route path="/orders/new" component={NewOrder} /><Route path="/orders/:orderId/view" component={ExistingOrderView} /><Route path="/orders/:orderId" component={ExistingOrderEditor} /><Route path="/404" component={NotFound} /><Route component={NotFound} /></Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right" /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
