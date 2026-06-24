import { SiteFormData } from "./schema";

export interface StatusEntry {
  status: string;
  date: string;
}

/** A persisted proposal: the form data plus app-managed metadata. */
export interface Proposal extends SiteFormData {
  id: string;
  createdAt: string;
  updatedAt?: string;
  statusHistory?: StatusEntry[];
  lat?: number;
  lng?: number;
  /** Soft-delete flag. Archived proposals are hidden but recoverable. */
  archived?: boolean;
  archivedAt?: string;
}

export interface StatusOption {
  value: string;
  color: string;
  bg: string;
}

export interface AppSettings {
  /** Days from creation until a proposal's conversion window closes. */
  deadlineDays: number;
  /** Base coordinates used for the "distance from base" filter. */
  baseLat: number;
  baseLng: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  deadlineDays: 90,
  baseLat: 12.9716,
  baseLng: 77.5946,
};
