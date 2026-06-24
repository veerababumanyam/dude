import { get, set, del } from "idb-keyval";
import type { Proposal, StatusOption, AppSettings } from "../types";
import { DEFAULT_SETTINGS } from "../types";

/**
 * Centralized, versioned persistence layer.
 *
 * All keys are namespaced under `dude_*`. A one-time migration copies data
 * from the legacy `karya_*` keys and normalizes the stored shape, so existing
 * users keep their data after the rebrand.
 */

const PREFIX = "dude";
const SCHEMA_VERSION = 2;

export const KEYS = {
  submissions: `${PREFIX}_submissions`,
  draft: `${PREFIX}_draft`,
  statuses: `${PREFIX}_statuses`,
  recentSearches: `${PREFIX}_recent_searches`,
  settings: `${PREFIX}_settings`,
  profile: `${PREFIX}_profile`,
  language: `${PREFIX}_language`,
  auth: `${PREFIX}_auth`,
  meta: `${PREFIX}_meta`,
} as const;

const LEGACY = {
  submissions: "karya_submissions",
  draft: "karya_draft",
  statuses: "karya_statuses",
  recentSearches: "karya_recent_searches",
} as const;

interface Meta {
  version: number;
}

/** Ensure a stored proposal has all current fields populated. */
function normalizeProposal(p: any): Proposal {
  return {
    ...p,
    archived: p.archived ?? false,
    statusHistory: p.statusHistory ?? [],
    createdAt: p.createdAt ?? new Date().toISOString(),
  };
}

let migrationPromise: Promise<void> | null = null;

/** Idempotent migration from legacy keys + schema normalization. Runs once. */
export function runMigrations(): Promise<void> {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    const meta = (await get(KEYS.meta)) as Meta | undefined;
    if (meta?.version === SCHEMA_VERSION) return;

    // Pull from new keys first, falling back to legacy karya_* keys.
    const submissions =
      ((await get(KEYS.submissions)) as any[] | undefined) ??
      ((await get(LEGACY.submissions)) as any[] | undefined);
    const statuses =
      ((await get(KEYS.statuses)) as StatusOption[] | undefined) ??
      ((await get(LEGACY.statuses)) as StatusOption[] | undefined);
    const recent =
      ((await get(KEYS.recentSearches)) as string[] | undefined) ??
      ((await get(LEGACY.recentSearches)) as string[] | undefined);
    const draft = (await get(KEYS.draft)) ?? (await get(LEGACY.draft));

    if (submissions) {
      await set(KEYS.submissions, submissions.map(normalizeProposal));
    }
    if (statuses) await set(KEYS.statuses, statuses);
    if (recent) await set(KEYS.recentSearches, recent);
    if (draft) await set(KEYS.draft, draft);

    // Clean up legacy keys once copied.
    await Promise.all(Object.values(LEGACY).map((k) => del(k).catch(() => {})));

    await set(KEYS.meta, { version: SCHEMA_VERSION } satisfies Meta);
  })();
  return migrationPromise;
}

export async function loadSubmissions(): Promise<Proposal[] | undefined> {
  await runMigrations();
  const raw = (await get(KEYS.submissions)) as any[] | undefined;
  return raw?.map(normalizeProposal);
}

export function saveSubmissions(submissions: Proposal[]): Promise<void> {
  return set(KEYS.submissions, submissions);
}

export async function loadStatuses(): Promise<StatusOption[] | undefined> {
  await runMigrations();
  return (await get(KEYS.statuses)) as StatusOption[] | undefined;
}

export function saveStatuses(statuses: StatusOption[]): Promise<void> {
  return set(KEYS.statuses, statuses);
}

export async function loadRecentSearches(): Promise<string[] | undefined> {
  await runMigrations();
  return (await get(KEYS.recentSearches)) as string[] | undefined;
}

export function saveRecentSearches(searches: string[]): Promise<void> {
  return set(KEYS.recentSearches, searches);
}

export function loadDraft(): Promise<unknown> {
  return get(KEYS.draft);
}

export function saveDraft(draft: unknown): Promise<void> {
  return set(KEYS.draft, draft);
}

export function clearDraft(): Promise<void> {
  return del(KEYS.draft);
}

export async function loadSettings(): Promise<AppSettings> {
  await runMigrations();
  const stored = (await get(KEYS.settings)) as Partial<AppSettings> | undefined;
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: AppSettings): Promise<void> {
  return set(KEYS.settings, settings);
}

export async function loadProfileId(): Promise<string | undefined> {
  await runMigrations();
  return (await get(KEYS.profile)) as string | undefined;
}

export function saveProfileId(id: string): Promise<void> {
  return set(KEYS.profile, id);
}

export async function loadLanguage(): Promise<string | undefined> {
  await runMigrations();
  return (await get(KEYS.language)) as string | undefined;
}

export function saveLanguage(lang: string): Promise<void> {
  return set(KEYS.language, lang);
}

export async function loadAuth(): Promise<boolean> {
  await runMigrations();
  return ((await get(KEYS.auth)) as boolean | undefined) ?? false;
}

export function saveAuth(authed: boolean): Promise<void> {
  return set(KEYS.auth, authed);
}
