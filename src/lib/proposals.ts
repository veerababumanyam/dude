import { addDays, differenceInDays, format } from "date-fns";
import type { Proposal, StatusOption } from "../types";

/** Resolve the Tailwind badge classes for a status from the live status list. */
export function getStatusBg(statuses: StatusOption[], value: string): string {
  return (
    statuses.find((s) => s.value === value)?.bg ||
    "bg-neutral-100 text-neutral-800 border-neutral-200"
  );
}

const ID_PREFIX = "DUDE";

/**
 * Generate the next proposal ID based on the highest existing numeric suffix.
 * Never reuses an ID even after deletes/archives, avoiding key collisions.
 */
export function nextProposalId(existing: Proposal[]): string {
  const maxNum = existing.reduce((max, p) => {
    const match = /(\d+)\s*$/.exec(p.id ?? "");
    const n = match ? parseInt(match[1], 10) : 0;
    return n > max ? n : max;
  }, 0);
  return `${ID_PREFIX}-${String(maxNum + 1).padStart(3, "0")}`;
}

export function deadlineFor(p: Proposal, deadlineDays: number): Date {
  return addDays(new Date(p.createdAt), deadlineDays);
}

export function daysRemaining(p: Proposal, deadlineDays: number): number {
  return differenceInDays(deadlineFor(p, deadlineDays), new Date());
}

export function isClosingSoon(p: Proposal, deadlineDays: number): boolean {
  const d = daysRemaining(p, deadlineDays);
  return d <= 30 && d > 0;
}

export function isOverdue(p: Proposal, deadlineDays: number): boolean {
  return daysRemaining(p, deadlineDays) <= 0;
}

// Haversine distance in km.
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Neutralize CSV/spreadsheet formula injection. A value beginning with
 * = + - @ (or tab/CR) can execute as a formula in Excel/Sheets.
 */
function csvSafe(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  // Escape quotes and wrap.
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCSV(proposals: Proposal[], deadlineDays: number): string {
  const headers = [
    "ID",
    "Site Name",
    "Location",
    "Unit Type",
    "Status",
    "Quotation Value",
    "Days Remaining",
    "Created At",
  ];
  const rows = proposals.map((p) =>
    [
      p.id,
      p.siteName,
      p.location,
      p.unitType,
      p.status,
      p.quotationValue || 0,
      daysRemaining(p, deadlineDays),
      format(new Date(p.createdAt), "yyyy-MM-dd"),
    ]
      .map(csvSafe)
      .join(","),
  );
  return [headers.map(csvSafe).join(","), ...rows].join("\n");
}

export function downloadCSV(
  csv: string,
  filename = "dude_proposals.csv",
): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
