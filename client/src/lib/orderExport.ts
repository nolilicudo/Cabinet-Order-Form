import { money } from "./woodoo";

type Item = { productCodeSnapshot: string; descriptionSnapshot: string; categorySnapshot: string; doorStyleSnapshot: string; finishColorSnapshot: string; unitPriceCentsSnapshot: number; quantity: number };
type Order = { id: number; customerName: string; customerAddress: string; customerPhone: string; shippingMethod: string; estimateNumber: string; status: string; installationCents: number };
const csv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function downloadOrderCsv(order: Order, items: Item[], subtotalCents: number, totalCents = subtotalCents + order.installationCents) {
  const rows = [["Woodoo Cabinet Order", ""], ["Estimate", order.estimateNumber], ["Customer", order.customerName], ["Address", order.customerAddress], ["Phone", order.customerPhone], ["Shipping", order.shippingMethod], ["Status", order.status], [], ["Product code", "Description", "Room", "Door style", "Finish", "Qty", "Unit MSRP", "Line total"], ...items.map(item => [item.productCodeSnapshot, item.descriptionSnapshot, item.categorySnapshot, item.doorStyleSnapshot, item.finishColorSnapshot, item.quantity, money(item.unitPriceCentsSnapshot), money(item.unitPriceCentsSnapshot * item.quantity)]), [], ["Cabinet subtotal", money(subtotalCents)], ["Installation", money(order.installationCents)], ["Order total", money(totalCents)]];
  const blob = new Blob([rows.map(row => row.map(value => csv(value ?? "")).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href; link.download = `woodoo-order-${order.estimateNumber || order.id}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(href);
}

export function printOrderSheet(order: Order, items: Item[], subtotalCents: number, totalCents = subtotalCents + order.installationCents) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  const rows = items.map(item => `<tr><td>${item.productCodeSnapshot}</td><td>${item.descriptionSnapshot}</td><td>${item.categorySnapshot}</td><td>${item.doorStyleSnapshot} / ${item.finishColorSnapshot}</td><td>${item.quantity}</td><td>${money(item.unitPriceCentsSnapshot)}</td><td>${money(item.unitPriceCentsSnapshot * item.quantity)}</td></tr>`).join("");
  popup.document.write(`<!doctype html><html><head><title>Woodoo ${order.estimateNumber}</title><style>body{font-family:Arial;color:#173c28;padding:36px}h1{font-family:Georgia;margin:0 0 4px}small{color:#68766d;text-transform:uppercase;letter-spacing:.12em}.meta{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:26px 0;padding:18px;background:#f5f3eb}.meta b{display:block;font-size:11px;text-transform:uppercase;color:#68766d}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;background:#173c28;color:white;padding:9px}td{padding:9px;border-bottom:1px solid #dedbd2;vertical-align:top}.total{margin:24px 0 0 auto;width:260px;text-align:right;font-size:15px}.total b{display:block;margin-top:8px;font-size:19px}</style></head><body><small>Design Your Price · Woodoo order sheet</small><h1>Cabinet order</h1><div class="meta"><div><b>Customer</b>${order.customerName}<br>${order.customerAddress}<br>${order.customerPhone}</div><div><b>Order details</b>Estimate: ${order.estimateNumber}<br>Shipping: ${order.shippingMethod}<br>Status: ${order.status}</div></div><table><thead><tr><th>Code</th><th>Cabinet</th><th>Room</th><th>Configuration</th><th>Qty</th><th>Unit MSRP</th><th>Line total</th></tr></thead><tbody>${rows}</tbody></table><div class="total">Cabinet subtotal: ${money(subtotalCents)}<br>Installation: ${money(order.installationCents)}<b>Order total: ${money(totalCents)}</b></div><script>window.onload=()=>window.print();<\/script></body></html>`);
  popup.document.close();
}
