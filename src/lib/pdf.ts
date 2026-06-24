import { format } from "date-fns";
import type { Proposal, StatusOption } from "../types";
import { formatCurrency } from "../utils";

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

export function pdfFilename(proposal: Proposal): string {
  return `Proposal_${proposal.id}_${proposal.siteName.replace(/\s+/g, "_")}.pdf`;
}

const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) =>
      (({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }) as Record<
        string,
        string
      >)[c],
  );

/**
 * Build a self-contained proposal document with inline hex colors. We never
 * capture the live app DOM — Tailwind v4 emits `oklch()` colors that the
 * html2canvas bundled in html2pdf.js cannot parse (it produces blank/garbled
 * pages). Float-based rows render far more reliably than flexbox in canvas.
 */
function buildNode(
  proposal: Proposal,
  statuses: StatusOption[],
  t: TFunc,
): HTMLElement {
  const statusColor =
    statuses.find((s) => s.value === proposal.status)?.color ?? "#766f6c";
  const ACCENT = "#9c5354";
  const TEXT = "#2f2b29";
  const MUTED = "#766f6c";

  const row = (label: string, value: string) =>
    value
      ? `<div style="overflow:hidden;padding:7px 0;border-bottom:1px solid #eeeeee;">
           <span style="color:${MUTED};font-size:13px;float:left;">${esc(label)}</span>
           <span style="color:${TEXT};font-size:13px;font-weight:bold;float:right;text-align:right;">${esc(value)}</span>
         </div>`
      : "";

  const sectionTitle = (label: string) =>
    `<div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${ACCENT};font-weight:bold;margin:0 0 8px;">${esc(label)}</div>`;

  const services = (proposal.services ?? [])
    .map(
      (svc) =>
        `<span style="display:inline-block;padding:4px 10px;margin:0 6px 6px 0;background:#fff3f0;color:${ACCENT};border:1px solid #e9d3cf;border-radius:6px;font-size:11px;font-weight:bold;text-transform:uppercase;">${esc(
          t(`service.${svc}`),
        )}</span>`,
    )
    .join("");

  const handover = `${t(`handover.${proposal.handoverType}`)}${
    proposal.handoverOther ? ` (${proposal.handoverOther})` : ""
  }`;
  const targetDate = proposal.handoverMoment
    ? format(new Date(proposal.handoverMoment), "MMM d, yyyy h:mm a")
    : t("modals.notAvailable");

  const el = document.createElement("div");
  el.style.cssText =
    "width:760px;padding:40px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:" +
    TEXT +
    ";box-sizing:border-box;";
  el.innerHTML = `
    <div style="border-bottom:3px solid ${ACCENT};padding-bottom:16px;margin-bottom:24px;">
      <div style="font-size:12px;color:${MUTED};font-family:monospace;">${esc(proposal.id)}
        <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:10px;background:${statusColor};color:#ffffff;font-size:10px;font-weight:bold;text-transform:uppercase;">${esc(
          t(`status.${proposal.status}`),
        )}</span>
      </div>
      <div style="margin:10px 0 4px;font-size:26px;font-weight:bold;color:${TEXT};">${esc(proposal.siteName)}</div>
      <div style="color:${MUTED};font-size:14px;">${esc(proposal.location)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:16px;">
          ${sectionTitle(t("modals.generalDetails"))}
          ${row(t("modals.propertyType"), t(`unit.${proposal.unitType}`))}
          ${row(t("modals.totalArea"), t("modals.sqftValue", { value: proposal.overallSqft?.toLocaleString() || 0 }))}
          ${(proposal.clubhouseSqft ?? 0) > 0 ? row(t("modals.clubhouseArea"), t("modals.sqftValue", { value: proposal.clubhouseSqft!.toLocaleString() })) : ""}
          ${proposal.priority ? row(t("modals.priority"), t(`modals.priority.${proposal.priority}`)) : ""}
          <div style="height:20px;"></div>
          ${sectionTitle(t("modals.contactHandover"))}
          ${row(t("modals.poc"), t(`poc.${proposal.pocType}`))}
          ${row(t("modals.handoverBy"), handover)}
          ${row(t("modals.tenure"), `${proposal.tenureValue ?? ""} ${t(`modals.tenureUnit.${proposal.tenureUnit}`)}`)}
          ${row(t("modals.targetDate"), targetDate)}
        </td>
        <td style="width:50%;vertical-align:top;padding-left:16px;">
          ${sectionTitle(t("modals.servicesSetup"))}
          <div>${services || `<span style="color:${MUTED};font-size:13px;">${esc(t("modals.noServicesSelected"))}</span>`}</div>
          <div style="margin-top:24px;background:#fff3f0;border:1px solid #e9d3cf;border-radius:10px;padding:16px;">
            ${sectionTitle(t("modals.commercialOverview"))}
            ${row(t("modals.esiPfIncluded"), proposal.esiPf ? t(`modals.yesNo.${proposal.esiPf}`) : t("modals.yesNo.No"))}
            <div style="overflow:hidden;margin-top:12px;">
              <span style="color:${ACCENT};font-weight:bold;font-size:16px;float:left;">${esc(t("modals.finalQuotation"))}</span>
              <span style="color:${ACCENT};font-weight:bold;font-size:22px;font-family:monospace;float:right;">${esc(formatCurrency(proposal.quotationValue || 0))}</span>
            </div>
          </div>
        </td>
      </tr>
    </table>
  `;
  return el;
}

const PDF_OPTS = (proposal: Proposal) => ({
  margin: 10,
  filename: pdfFilename(proposal),
  image: { type: "jpeg" as const, quality: 0.98 },
  html2canvas: { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false },
  jsPDF: {
    unit: "mm" as const,
    format: "a4" as const,
    orientation: "portrait" as const,
  },
});

/**
 * Mount the node at on-screen coordinates (0,0) — html2canvas captures relative
 * to the document, so far-off-screen elements render blank. The open modal sits
 * above it (z-50), so the user never sees a flash. Always removed afterwards.
 */
async function withMountedNode<T>(
  node: HTMLElement,
  fn: () => Promise<T>,
): Promise<T> {
  node.style.position = "fixed";
  node.style.left = "0";
  node.style.top = "0";
  node.style.zIndex = "-1";
  node.style.pointerEvents = "none";
  document.body.appendChild(node);
  try {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    return await fn();
  } finally {
    node.remove();
  }
}

export async function downloadProposalPdf(
  proposal: Proposal,
  statuses: StatusOption[],
  t: TFunc,
): Promise<void> {
  const { default: html2pdf } = await import("html2pdf.js");
  const node = buildNode(proposal, statuses, t);
  await withMountedNode(node, () =>
    html2pdf().set(PDF_OPTS(proposal)).from(node).save(),
  );
}

export async function proposalPdfBlob(
  proposal: Proposal,
  statuses: StatusOption[],
  t: TFunc,
): Promise<Blob> {
  const { default: html2pdf } = await import("html2pdf.js");
  const node = buildNode(proposal, statuses, t);
  return withMountedNode(node, () =>
    html2pdf().set(PDF_OPTS(proposal)).from(node).outputPdf("blob"),
  );
}
