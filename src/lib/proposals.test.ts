import { describe, it, expect } from "vitest";
import {
  nextProposalId,
  toCSV,
  daysRemaining,
  distanceKm,
  getStatusBg,
} from "./proposals";
import type { Proposal } from "../types";

function makeProposal(over: Partial<Proposal> = {}): Proposal {
  return {
    id: "DUDE-001",
    siteName: "Site",
    location: "Loc",
    unitType: "Apartment",
    overallSqft: 1000,
    clubhouseSqft: 0,
    services: [],
    pocType: "Facility Manager",
    handoverType: "Builder",
    tenureValue: 12,
    tenureUnit: "Months",
    handoverMoment: "2026-01-01T10:00",
    esiPf: "Yes",
    status: "Quotation Sent",
    timings: ["Residential"],
    quotationValue: 100000,
    createdAt: new Date().toISOString(),
    archived: false,
    ...over,
  };
}

describe("nextProposalId", () => {
  it("starts at 001 for an empty list", () => {
    expect(nextProposalId([])).toBe("DUDE-001");
  });

  it("uses the max numeric suffix, never reusing IDs after deletes", () => {
    const list = [
      makeProposal({ id: "DUDE-001" }),
      makeProposal({ id: "DUDE-005" }),
    ];
    expect(nextProposalId(list)).toBe("DUDE-006");
  });

  it("does not collide when a middle item was removed", () => {
    // Two items existed, DUDE-001 removed; max is still 002 → next is 003.
    const list = [makeProposal({ id: "DUDE-002" })];
    expect(nextProposalId(list)).toBe("DUDE-003");
  });

  it("handles legacy KRY-prefixed ids", () => {
    const list = [makeProposal({ id: "KRY-009" })];
    expect(nextProposalId(list)).toBe("DUDE-010");
  });
});

describe("toCSV", () => {
  it("includes a header row and one row per proposal", () => {
    const csv = toCSV([makeProposal()], 90);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("Site Name");
    expect(lines).toHaveLength(2);
  });

  it("neutralizes formula injection in fields", () => {
    const csv = toCSV([makeProposal({ siteName: "=HYPERLINK(evil)" })], 90);
    // The dangerous value must be prefixed with a single quote.
    expect(csv).toContain('"\'=HYPERLINK(evil)"');
  });

  it("escapes embedded quotes", () => {
    const csv = toCSV([makeProposal({ siteName: 'A "Quoted" Site' })], 90);
    expect(csv).toContain('"A ""Quoted"" Site"');
  });
});

describe("daysRemaining", () => {
  it("is positive for a fresh proposal", () => {
    const p = makeProposal({ createdAt: new Date().toISOString() });
    expect(daysRemaining(p, 90)).toBeGreaterThan(80);
  });

  it("is non-positive for an expired proposal", () => {
    const old = new Date();
    old.setDate(old.getDate() - 200);
    const p = makeProposal({ createdAt: old.toISOString() });
    expect(daysRemaining(p, 90)).toBeLessThanOrEqual(0);
  });
});

describe("distanceKm", () => {
  it("is zero for identical points", () => {
    expect(distanceKm(12.97, 77.59, 12.97, 77.59)).toBeCloseTo(0, 5);
  });

  it("computes a sane positive distance", () => {
    // Bangalore → Mysore is roughly 120-150 km.
    const d = distanceKm(12.9716, 77.5946, 12.2958, 76.6394);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(170);
  });
});

describe("getStatusBg", () => {
  const statuses = [{ value: "Open", color: "#000", bg: "bg-open" }];
  it("returns the matching badge classes", () => {
    expect(getStatusBg(statuses, "Open")).toBe("bg-open");
  });
  it("falls back for unknown statuses", () => {
    expect(getStatusBg(statuses, "Missing")).toContain("bg-neutral");
  });
});
