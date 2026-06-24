import { z } from "zod";

/** Empty string / null / NaN → undefined, so empty inputs read as "missing". */
const emptyToUndefined = (v: unknown) =>
  v === "" || v === null || (typeof v === "number" && Number.isNaN(v))
    ? undefined
    : v;

/** Required, non-negative number with a friendly "required" message. */
const requiredNumber = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.number({ error: message }).min(0, "Cannot be negative"),
  );

/** Required positive number (>= 1). */
const requiredPositive = (message: string) =>
  z.preprocess(emptyToUndefined, z.number({ error: message }).min(1, message));

/** Optional, non-negative number. */
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.number().min(0, "Cannot be negative").optional(),
);

const qtyWithModifiers = z.object({
  qty: optionalNumber,
  gender: z.string().optional(),
  shift: z.string().optional(),
});

const qtyWithGender = z.object({
  qty: optionalNumber,
  gender: z.string().optional(),
});

export const siteFormSchema = z
  .object({
    // Section A
    serialNo: z.string().optional(),
    siteName: z
      .string()
      .min(1, "Site name is required")
      .max(100, "Maximum 100 characters allowed"),
    location: z.string().min(1, "Location is required"),
    unitType: z.string().min(1, "Unit type is required"),
    unitOther: z.string().optional(),
    overallSqft: requiredNumber("Overall area is required"),
    clubhouseSqft: requiredNumber("Clubhouse area is required"),

    // Section B - Services Matrix
    services: z.array(z.string()),

    housekeeping: z
      .object({
        hkExecutive: optionalNumber,
        hkSupervisor: optionalNumber,
        hkStaff: optionalNumber,
      })
      .optional(),

    security: z
      .object({
        so: qtyWithModifiers,
        aso: qtyWithModifiers,
        supervisor: qtyWithModifiers,
        guards: qtyWithModifiers,
      })
      .optional(),

    mep: z
      .object({
        fm: optionalNumber,
        afm: optionalNumber,
        executive: optionalNumber,
        helpdesk: optionalNumber,
        techSupervisor: optionalNumber,
        electricians: optionalNumber,
        plumbers: optionalNumber,
        mst: optionalNumber,
        mason: optionalNumber,
        carpenter: optionalNumber,
        painter: optionalNumber,
        stpOperator: optionalNumber,
        wtpOperator: optionalNumber,
        poolOperator: optionalNumber,
        cctvOperator: optionalNumber,
        fireSafetyOperator: optionalNumber,
        accountant: optionalNumber,
      })
      .optional(),

    horticulture: z
      .object({
        gardenerSupervisor: qtyWithGender,
        gardeners: qtyWithGender,
      })
      .optional(),

    coaches: z
      .object({
        gym: optionalNumber,
        pool: optionalNumber,
        yoga: optionalNumber,
        badminton: optionalNumber,
      })
      .optional(),

    pestControl: z.boolean().optional(),

    // Section C
    pocType: z.string().min(1, "Point of contact is required"),
    pocOther: z.string().optional(),
    handoverType: z.string().min(1, "Handover information is required"),
    handoverOther: z.string().optional(),
    tenureValue: requiredPositive("Tenure is required"),
    tenureUnit: z.string().min(1, "Tenure unit is required"),
    handoverMoment: z.string().min(1, "Handover date/time is required"),
    handoverNotes: z.string().optional(),

    // Section D
    salaries: z.record(z.string(), optionalNumber).optional(),
    esiPf: z.string().min(1, "ESI & PF status is required"),
    status: z.string().min(1, "Status is required"),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    timings: z.array(z.string()).min(1, "Select at least one timing"),
    timingNotes: z.string().optional(),
    quotationValue: requiredNumber("Quotation value is required"),

    // Metadata
    createdAt: z.string().optional(),
  })
  .refine((data) => !(data.unitType === "Other" && !data.unitOther), {
    message: "Specify the unit type",
    path: ["unitOther"],
  })
  .refine((data) => !(data.pocType === "Others" && !data.pocOther), {
    message: "Specify point of contact",
    path: ["pocOther"],
  })
  .refine((data) => !(data.handoverType === "Others" && !data.handoverOther), {
    message: "Specify handover information",
    path: ["handoverOther"],
  });

export type SiteFormData = z.infer<typeof siteFormSchema>;
