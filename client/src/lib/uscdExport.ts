type ComparisonLine = {
  baseSku: string;
  orderSku: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  addonEachCents: number;
};

type FinishComparison = {
  finish: { name: string; transferRequired: boolean; discontinued: boolean };
  subtotalCents: number;
  deliveryCents: number;
  freightCents: number;
  installationCents: number;
  totalCents: number;
  containsPlanningPrice: boolean;
  lines: ComparisonLine[];
};

const money = (cents: number) => (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export function downloadUsCdComparisonCsv(estimateNumber: string, comparisons: FinishComparison[]) {
  const rows = [['Estimate', 'Finish', 'Base SKU', 'Order SKU', 'Description', 'Qty', 'Unit price', 'Add-on each', 'Line total', 'Price basis']];
  for (const comparison of comparisons) {
    for (const line of comparison.lines) {
      rows.push([estimateNumber, comparison.finish.name, line.baseSku, line.orderSku, line.description, String(line.quantity), money(line.unitPriceCents), money(line.addonEachCents), money(line.quantity * (line.unitPriceCents + line.addonEachCents)), comparison.containsPlanningPrice ? 'Planning — verify in Quick Order' : 'Direct source price']);
    }
    rows.push([estimateNumber, comparison.finish.name, '', '', 'Cabinet subtotal', '', '', '', money(comparison.subtotalCents), '']);
    rows.push([estimateNumber, comparison.finish.name, '', '', 'Delivery', '', '', '', money(comparison.deliveryCents), '']);
    rows.push([estimateNumber, comparison.finish.name, '', '', 'Freight', '', '', '', money(comparison.freightCents), '']);
    rows.push([estimateNumber, comparison.finish.name, '', '', 'Installation', '', '', '', money(comparison.installationCents), '']);
    rows.push([estimateNumber, comparison.finish.name, '', '', 'Package total', '', '', '', money(comparison.totalCents), '']);
  }
  const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  anchor.download = `${estimateNumber || 'uscd-package'}-finish-comparison.csv`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}
