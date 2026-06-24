import { z } from "zod";

export const siteFormSchema = z.object({
  // Section A
  serialNo: z.string().optional(),
  siteName: z.string().min(1, "Site name is required").max(100, "Maximum 100 characters allowed"),
  location: z.string().min(1, "Location is required"),
  unitType: z.string().min(1, "Unit type is required"),
  unitOther: z.string().optional(),
  overallSqft: z.number().min(0, "Cannot be negative"),
  clubhouseSqft: z.number().min(0, "Cannot be negative"),

  // Section B - Services Matrix
  services: z.array(z.string()),
  
  // Service Sub-options
  housekeeping: z.object({
    hkExecutive: z.number().min(0).optional(),
    hkSupervisor: z.number().min(0).optional(),
    hkStaff: z.number().min(0).optional(),
  }).optional(),

  security: z.object({
    so: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional(), shift: z.string().optional() }),
    aso: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional(), shift: z.string().optional() }),
    supervisor: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional(), shift: z.string().optional() }),
    guards: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional(), shift: z.string().optional() }),
  }).optional(),

  mep: z.object({
    fm: z.number().min(0).optional(),
    afm: z.number().min(0).optional(),
    executive: z.number().min(0).optional(),
    helpdesk: z.number().min(0).optional(),
    techSupervisor: z.number().min(0).optional(),
    electricians: z.number().min(0).optional(),
    plumbers: z.number().min(0).optional(),
    mst: z.number().min(0).optional(),
    mason: z.number().min(0).optional(),
    carpenter: z.number().min(0).optional(),
    painter: z.number().min(0).optional(),
    stpOperator: z.number().min(0).optional(),
    wtpOperator: z.number().min(0).optional(),
    poolOperator: z.number().min(0).optional(),
    cctvOperator: z.number().min(0).optional(),
    fireSafetyOperator: z.number().min(0).optional(),
    accountant: z.number().min(0).optional(),
  }).optional(),

  horticulture: z.object({
    gardenerSupervisor: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional() }),
    gardeners: z.object({ qty: z.number().min(0).optional(), gender: z.string().optional() }),
  }).optional(),

  coaches: z.object({
    gym: z.number().min(0).optional(),
    pool: z.number().min(0).optional(),
    yoga: z.number().min(0).optional(),
    badminton: z.number().min(0).optional(),
  }).optional(),

  pestControl: z.boolean().optional(),

  // Section C
  pocType: z.string().min(1, "Point of contact is required"),
  pocOther: z.string().optional(),
  handoverType: z.string().min(1, "Handover information is required"),
  handoverOther: z.string().optional(),
  tenureValue: z.number().min(1, "Tenure is required"),
  tenureUnit: z.string().min(1, "Tenure unit is required"),
  handoverMoment: z.string().min(1, "Handover date/time is required"),
  handoverNotes: z.string().optional(),

  // Section D
  salaries: z.record(z.string(), z.number().min(0).optional()).optional(),
  esiPf: z.string().min(1, "ESI & PF status is required"),
  status: z.string().min(1, "Status is required"),
  priority: z.enum(['High', 'Medium', 'Low']).optional(),
  timings: z.array(z.string()).min(1, "Select at least one timing"),
  timingNotes: z.string().optional(),
  quotationValue: z.number().min(0, "Cannot be negative"),

  // Metadata
  createdAt: z.string().optional(),
}).refine(data => {
  if (data.unitType === "Other" && !data.unitOther) {
    return false;
  }
  return true;
}, {
  message: "Specify the unit type",
  path: ["unitOther"]
}).refine(data => {
  if (data.pocType === "Others" && !data.pocOther) {
    return false;
  }
  return true;
}, {
  message: "Specify point of contact",
  path: ["pocOther"]
}).refine(data => {
  if (data.handoverType === "Others" && !data.handoverOther) {
    return false;
  }
  return true;
}, {
  message: "Specify handover information",
  path: ["handoverOther"]
});

export type SiteFormData = z.infer<typeof siteFormSchema>;
