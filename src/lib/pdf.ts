import { format } from "date-fns";
import type { Proposal, StatusOption } from "../types";
import { translations } from "../i18n/translations";

export function pdfFilename(proposal: Proposal): string {
  return `Proposal_${proposal.id}_${proposal.siteName.replace(/\s+/g, "_")}.pdf`;
}

// The PDF is rendered with jsPDF's core (WinAnsi) fonts, which only cover
// Latin text — so labels/values are emitted in English regardless of the UI
// language, and currency uses an "INR" prefix instead of the ₹ glyph. This is
// 100% reliable (no html2canvas/oklch rasterization that produced blank pages).
function tEn(key: string, vars?: Record<string, string | number>): string {
  let s = translations.en[key] ?? key;
  if (vars) {
    s = s.replace(/\{(\w+)\}/g, (_, n) => (n in vars ? String(vars[n]) : `{${n}}`));
  }
  return s;
}

function formatINR(n: number): string {
  return `INR ${Math.round(n || 0).toLocaleString("en-IN")}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m
    ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
    : [118, 111, 108];
}

const ACCENT: [number, number, number] = [156, 83, 84]; // brand-700 #9c5354
const TEXT: [number, number, number] = [47, 43, 41];
const MUTED: [number, number, number] = [118, 111, 108];

type JsPDFCtor = typeof import("jspdf").jsPDF;

function render(JsPDF: JsPDFCtor, proposal: Proposal, statuses: StatusOption[]) {
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const PW = 210;
  const MX = 15; // left margin
  const RX = PW - MX; // right edge
  let y = 20;

  // --- Header ---
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
  doc.text(proposal.id, MX, y);

  const statusText = tEn(`status.${proposal.status}`);
  const statusColor = hexToRgb(
    statuses.find((s) => s.value === proposal.status)?.color ?? "#9c5354",
  );
  doc.setFont("helvetica", "bold").setFontSize(8);
  const badgeW = doc.getTextWidth(statusText.toUpperCase()) + 7;
  doc.setFillColor(...statusColor);
  doc.roundedRect(RX - badgeW, y - 4, badgeW, 6, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(statusText.toUpperCase(), RX - badgeW / 2, y, { align: "center" });

  y += 11;
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(...TEXT);
  doc.text(doc.splitTextToSize(proposal.siteName, RX - MX), MX, y);

  y += 8;
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(...MUTED);
  doc.text(proposal.location || "", MX, y);

  y += 5;
  doc.setDrawColor(...ACCENT).setLineWidth(0.8).line(MX, y, RX, y);
  y += 9;

  // --- Helpers ---
  const section = (title: string) => {
    y += 3;
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ACCENT);
    doc.text(title.toUpperCase(), MX, y);
    y += 7;
  };
  const row = (label: string, value: string) => {
    if (!value) return;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
    doc.text(label, MX, y);
    doc.setFont("helvetica", "bold").setTextColor(...TEXT);
    doc.text(doc.splitTextToSize(value, 95), RX, y, { align: "right" });
    y += 3;
    doc.setDrawColor(235, 235, 235).setLineWidth(0.1).line(MX, y, RX, y);
    y += 6;
  };
  const wrapped = (label: string, value: string) => {
    if (!value) return;
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...MUTED);
    doc.text(label, MX, y);
    y += 5;
    doc.setFont("helvetica", "bold").setTextColor(...TEXT);
    const lines = doc.splitTextToSize(value, RX - MX) as string[];
    doc.text(lines, MX, y);
    y += lines.length * 5 + 1;
    doc.setDrawColor(235, 235, 235).setLineWidth(0.1).line(MX, y, RX, y);
    y += 6;
  };

  // --- General details ---
  section(tEn("modals.generalDetails"));
  row(tEn("modals.propertyType"), tEn(`unit.${proposal.unitType}`));
  row(
    tEn("modals.totalArea"),
    `${(proposal.overallSqft ?? 0).toLocaleString("en-IN")} Sq.ft`,
  );
  if ((proposal.clubhouseSqft ?? 0) > 0) {
    row(
      tEn("modals.clubhouseArea"),
      `${proposal.clubhouseSqft!.toLocaleString("en-IN")} Sq.ft`,
    );
  }
  if (proposal.priority) {
    row(tEn("modals.priority"), tEn(`modals.priority.${proposal.priority}`));
  }

  // --- Contact & handover ---
  section(tEn("modals.contactHandover"));
  row(tEn("modals.poc"), tEn(`poc.${proposal.pocType}`));
  row(
    tEn("modals.handoverBy"),
    `${tEn(`handover.${proposal.handoverType}`)}${
      proposal.handoverOther ? ` (${proposal.handoverOther})` : ""
    }`,
  );
  if (proposal.tenureValue) {
    row(
      tEn("modals.tenure"),
      `${proposal.tenureValue} ${tEn(`modals.tenureUnit.${proposal.tenureUnit}`)}`,
    );
  }
  row(
    tEn("modals.targetDate"),
    proposal.handoverMoment
      ? format(new Date(proposal.handoverMoment), "MMM d, yyyy h:mm a")
      : tEn("modals.notAvailable"),
  );

  // --- Services & timings ---
  section(tEn("modals.servicesSetup"));
  wrapped(
    tEn("modals.servicesSetup"),
    (proposal.services ?? []).map((s) => tEn(`service.${s}`)).join(", ") ||
      tEn("modals.noServicesSelected"),
  );
  if (proposal.timings?.length) {
    wrapped(
      tEn("modals.timings"),
      proposal.timings.map((t) => tEn(`timing.${t}`)).join(", "),
    );
  }

  // --- Commercial overview ---
  section(tEn("modals.commercialOverview"));
  row(
    tEn("modals.esiPfIncluded"),
    proposal.esiPf ? tEn(`modals.yesNo.${proposal.esiPf}`) : tEn("modals.yesNo.No"),
  );

  y += 2;
  const [lr, lg, lb] = hexToRgb("#fff3f0");
  doc.setFillColor(lr, lg, lb);
  doc.roundedRect(MX, y, RX - MX, 16, 2, 2, "F");
  doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(...ACCENT);
  doc.text(tEn("modals.finalQuotation").toUpperCase(), MX + 5, y + 10);
  doc.setFontSize(16);
  doc.text(formatINR(proposal.quotationValue || 0), RX - 5, y + 10, {
    align: "right",
  });

  return doc;
}

async function jspdf(): Promise<JsPDFCtor> {
  // Lazy-load to keep jsPDF out of the initial bundle.
  const mod = await import("jspdf");
  return mod.jsPDF;
}

export async function downloadProposalPdf(
  proposal: Proposal,
  statuses: StatusOption[],
): Promise<void> {
  const JsPDF = await jspdf();
  render(JsPDF, proposal, statuses).save(pdfFilename(proposal));
}

export async function proposalPdfBlob(
  proposal: Proposal,
  statuses: StatusOption[],
): Promise<Blob> {
  const JsPDF = await jspdf();
  return render(JsPDF, proposal, statuses).output("blob");
}
