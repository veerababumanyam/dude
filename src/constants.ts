export const UNIT_TYPES = [
  "Apartment",
  "Villa",
  "Commercial Complex",
  "Hospital",
  "School / College",
  "Other"
];

export const SERVICES = [
  { id: "housekeeping", label: "House Keeping" },
  { id: "security", label: "Security" },
  { id: "mep", label: "MEP" },
  { id: "horticulture", label: "Horticulture" },
  { id: "coaches", label: "Coaches (Others)" },
  { id: "pestControl", label: "Pest Control" },
];

export const POC_ROLES = [
  "MC Member",
  "General Secretary",
  "President",
  "Property Manager",
  "Facility Manager",
  "Vice President",
  "Human Resource Manager",
  "Managing Director",
  "General Manager",
  "Others"
];

export const HANDOVER_INFO = [
  "Builder",
  "Association",
  "Others"
];

export const STATUS_OPTIONS = [
  { value: "Quotation Sent", color: "#1d4ed8", bg: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "Need to Share Profile", color: "#b45309", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "Need to Send Quotation", color: "#b45309", bg: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "Need to Survey", color: "#7e22ce", bg: "bg-purple-100 text-purple-800 border-purple-200" },
  { value: "Survey is Done", color: "#15803d", bg: "bg-green-100 text-green-800 border-green-200" },
];

export const TIMING_OPTIONS = [
  "Residential",
  "Commercial",
  "Hospital (24/7)"
];

export const ROLE_LABELS: Record<string, string> = {
  // Housekeeping
  "hkExecutive": "HK Executive",
  "hkSupervisor": "HK Supervisor",
  "hkStaff": "HK Staff",
  
  // Security
  "so": "(SO) Security Officer",
  "aso": "(ASO) Asst. Security Officer",
  "supervisor": "Supervisor",
  "guards": "Security Guards",

  // MEP
  "fm": "FM (Facility Manager)",
  "afm": "AFM (Asst. Facility Manager)",
  "executive": "Executive",
  "helpdesk": "Helpdesk",
  "techSupervisor": "Technical Supervisor",
  "electricians": "Electricians",
  "plumbers": "Plumbers",
  "mst": "(MST) Multi-Skilled Tech",
  "mason": "Mason",
  "carpenter": "Carpenter",
  "painter": "Painter",
  "stpOperator": "STP Operator",
  "wtpOperator": "WTP Operator",
  "poolOperator": "Pool Operator",
  "cctvOperator": "CCTV Operator",
  "fireSafetyOperator": "Fire & Safety Operator",
  "accountant": "Accountant",

  // Horticulture
  "gardenerSupervisor": "Gardener Supervisor",
  "gardeners": "Gardeners",

  // Coaches
  "gym": "Gym Coach",
  "pool": "Pool Coach",
  "yoga": "Yoga Coach",
  "badminton": "Badminton Coach"
};
