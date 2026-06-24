import { describe, it, expect } from "vitest";
import { siteFormSchema } from "./schema";

const valid = {
  siteName: "Test Site",
  location: "Bangalore",
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
};

describe("siteFormSchema numeric handling", () => {
  it("accepts a fully valid payload", () => {
    expect(siteFormSchema.safeParse(valid).success).toBe(true);
  });

  it("reports a friendly required message for empty numbers (NaN)", () => {
    const res = siteFormSchema.safeParse({ ...valid, overallSqft: NaN });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === "overallSqft");
      expect(issue?.message).toBe("Overall area is required");
    }
  });

  it("rejects negative numbers with a clear message", () => {
    const res = siteFormSchema.safeParse({ ...valid, overallSqft: -5 });
    expect(res.success).toBe(false);
    if (!res.success) {
      const issue = res.error.issues.find((i) => i.path[0] === "overallSqft");
      expect(issue?.message).toBe("Cannot be negative");
    }
  });

  it("requires tenure to be at least 1", () => {
    const res = siteFormSchema.safeParse({ ...valid, tenureValue: 0 });
    expect(res.success).toBe(false);
  });

  it("requires conditional 'other' fields", () => {
    const res = siteFormSchema.safeParse({ ...valid, unitType: "Other" });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.path[0] === "unitOther")).toBe(
        true,
      );
    }
  });
});
