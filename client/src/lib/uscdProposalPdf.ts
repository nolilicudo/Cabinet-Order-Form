import { jsPDF } from "jspdf";

export type ProposalLine = { orderSku: string; description: string; quantity: number; unitPriceCents: number; addonEachCents: number };
export type ProposalComparison = {
  finish: { name: string; transferRequired: boolean; discontinued: boolean };
  subtotalCents: number;
  deliveryCents: number;
  freightCents: number;
  installationCents: number;
  totalCents: number;
  containsPlanningPrice: boolean;
  lines: ProposalLine[];
};

export type ProposalInput = {
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingMethod: string;
  estimateNumber: string;
  comparisons: ProposalComparison[];
};

const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export function buildUsCdProposalModel(input: ProposalInput) {
  return {
    title: `USCD Finish Comparison · ${input.estimateNumber || "Proposal"}`,
    pricingRows: input.comparisons.map(comparison => ({
      finishName: comparison.finish.name,
      cabinetsCents: comparison.subtotalCents,
      deliveryCents: comparison.deliveryCents,
      freightCents: comparison.freightCents,
      installationCents: comparison.installationCents,
      packageTotalCents: comparison.totalCents,
      lines: comparison.lines.map(line => ({ ...line, lineTotalCents: line.quantity * (line.unitPriceCents + line.addonEachCents) })),
    })),
  };
}

function addPageIfNeeded(doc: jsPDF, y: number, needed: number) {
  if (y + needed <= 272) return y;
  doc.addPage();
  return 22;
}

export function downloadUsCdProposalPdf(input: ProposalInput) {
  const doc = new jsPDF({ unit: "mm", format: "letter" });
  const createdOn = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date());
  const proposal = buildUsCdProposalModel(input);
  const title = proposal.title;
  let y = 18;

  doc.setFillColor(8, 47, 29);
  doc.rect(0, 0, 216, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Design Your Price", 16, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("U.S. Cabinet Depot · Capital Framed", 16, 20);
  doc.setTextColor(24, 42, 31);
  y = 43;

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.text("Cabinet finish comparison", 16, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(92, 109, 99);
  doc.text(`Prepared ${createdOn} · Estimate ${input.estimateNumber || "Not assigned"}`, 16, y);
  y += 11;

  doc.setTextColor(24, 42, 31);
  doc.setFillColor(247, 249, 245);
  doc.roundedRect(16, y, 184, 32, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CUSTOMER", 21, y + 8);
  doc.text("DELIVERY", 111, y + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(input.customerName || "Customer", 21, y + 15);
  doc.setFontSize(8);
  const address = doc.splitTextToSize(input.customerAddress || "Address to be confirmed", 76);
  doc.text(address, 21, y + 21);
  doc.setFontSize(10);
  doc.text(input.shippingMethod, 111, y + 15);
  doc.setFontSize(8);
  doc.text(input.customerPhone || "Phone to be confirmed", 111, y + 21);
  y += 43;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Package pricing by finish", 16, y);
  y += 7;
  doc.setFillColor(230, 237, 230);
  doc.rect(16, y, 184, 8, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(56, 75, 62);
  doc.text("FINISH", 20, y + 5.2);
  doc.text("CABINETS", 86, y + 5.2, { align: "right" });
  doc.text("DELIVERY", 108, y + 5.2, { align: "right" });
  doc.text("FREIGHT", 130, y + 5.2, { align: "right" });
  doc.text("INSTALL", 154, y + 5.2, { align: "right" });
  doc.text("PACKAGE TOTAL", 196, y + 5.2, { align: "right" });
  y += 8;
  for (const comparison of input.comparisons) {
    y = addPageIfNeeded(doc, y, 13);
    doc.setTextColor(24, 42, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(comparison.finish.name, 20, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(money(comparison.subtotalCents), 86, y + 5, { align: "right" });
    doc.text(money(comparison.deliveryCents), 108, y + 5, { align: "right" });
    doc.text(money(comparison.freightCents), 130, y + 5, { align: "right" });
    doc.text(money(comparison.installationCents), 154, y + 5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(money(comparison.totalCents), 196, y + 5, { align: "right" });
    const warning = comparison.finish.discontinued ? "Remaining stock confirmation required." : comparison.finish.transferRequired ? "Transfer availability and lead time must be confirmed." : comparison.containsPlanningPrice ? "Planning price — verify in Quick Order before purchase." : "Direct source-price basis.";
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 93, 35);
    doc.setFontSize(7);
    doc.text(warning, 20, y + 9);
    doc.setDrawColor(226, 230, 224);
    doc.line(16, y + 12, 200, y + 12);
    y += 13;
  }

  const reference = input.comparisons[0];
  if (reference) {
    y = addPageIfNeeded(doc, y, 22);
    y += 6;
    doc.setTextColor(24, 42, 31);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Included items · ${reference.finish.name}`, 16, y);
    y += 7;
    for (const line of reference.lines) {
      const description = doc.splitTextToSize(`${line.orderSku} · ${line.description}`, 135);
      y = addPageIfNeeded(doc, y, Math.max(10, description.length * 4 + 3));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(description, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Qty ${line.quantity}`, 165, y, { align: "right" });
      doc.text(money(line.quantity * (line.unitPriceCents + line.addonEachCents)), 196, y, { align: "right" });
      y += Math.max(7, description.length * 4 + 1);
    }
  }

  y = addPageIfNeeded(doc, y, 22);
  doc.setFillColor(255, 248, 225);
  doc.roundedRect(16, y + 4, 184, 17, 3, 3, "F");
  doc.setTextColor(95, 69, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PRICE & AVAILABILITY NOTE", 21, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("Cabinet finish comparisons are planning values from the U.S. Cabinet Depot source workbook. Confirm final availability, transfer requirements, and Quick Order pricing before purchase.", 21, y + 15, { maxWidth: 172 });

  const safeName = (input.estimateNumber || "uscd-proposal").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  doc.setProperties({ title, subject: "U.S. Cabinet Depot cabinet finish comparison" });
  doc.save(`${safeName}-finish-comparison.pdf`);
}
