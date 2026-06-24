import { useCallback, useEffect, useState } from "react";
import { addDays } from "date-fns";
import type { SiteFormData } from "../schema";
import type { AppSettings, Proposal, StatusOption } from "../types";
import { DEFAULT_SETTINGS } from "../types";
import { STATUS_OPTIONS } from "../constants";
import { nextProposalId } from "../lib/proposals";
import * as storage from "../lib/storage";

function seedProposals(): Proposal[] {
  const now = new Date();
  return [
    {
      id: "DUDE-001",
      siteName: "Prestige Lakeside Habitat",
      location: "Whitefield, Bangalore",
      lat: 12.9698,
      lng: 77.7499,
      unitType: "Apartment",
      overallSqft: 150000,
      clubhouseSqft: 20000,
      services: ["housekeeping", "security"],
      pocType: "Facility Manager",
      handoverType: "Builder",
      tenureValue: 12,
      tenureUnit: "Months",
      handoverMoment: addDays(now, 30).toISOString().slice(0, 16),
      esiPf: "Yes",
      status: "Quotation Sent",
      priority: "High",
      timings: ["Residential"],
      quotationValue: 450000,
      createdAt: now.toISOString(),
      archived: false,
      statusHistory: [{ status: "Quotation Sent", date: now.toISOString() }],
    },
    {
      id: "DUDE-002",
      siteName: "Brigade Tech Park",
      location: "Brookefield, Bangalore",
      lat: 12.9644,
      lng: 77.717,
      unitType: "Commercial Complex",
      overallSqft: 350000,
      clubhouseSqft: 0,
      services: ["mep", "security"],
      pocType: "Property Manager",
      handoverType: "Others",
      handoverOther: "Management Company",
      tenureValue: 24,
      tenureUnit: "Months",
      handoverMoment: addDays(now, 45).toISOString().slice(0, 16),
      esiPf: "Yes",
      status: "Need to Send Quotation",
      priority: "Medium",
      timings: ["Commercial"],
      quotationValue: 850000,
      // 70 days ago → ~20 days left, triggers the 30-day alert.
      createdAt: addDays(now, -70).toISOString(),
      archived: false,
      statusHistory: [
        {
          status: "Need to Send Quotation",
          date: addDays(now, -70).toISOString(),
        },
      ],
    },
  ];
}

export function useProposals() {
  const [submissions, setSubmissions] = useState<Proposal[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>(STATUS_OPTIONS);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Initial load (runs migrations under the hood).
  useEffect(() => {
    (async () => {
      const [saved, savedStatuses, savedSearches, savedSettings] =
        await Promise.all([
          storage.loadSubmissions(),
          storage.loadStatuses(),
          storage.loadRecentSearches(),
          storage.loadSettings(),
        ]);
      setSubmissions(saved && saved.length ? saved : seedProposals());
      if (savedStatuses?.length) setStatuses(savedStatuses);
      if (savedSearches) setRecentSearches(savedSearches);
      setSettings(savedSettings);
      setIsDataLoaded(true);
    })();
  }, []);

  // Persist submissions on change.
  useEffect(() => {
    if (isDataLoaded) storage.saveSubmissions(submissions);
  }, [submissions, isDataLoaded]);

  const createProposal = useCallback(
    (data: SiteFormData & { lat?: number; lng?: number }): Proposal => {
      const now = new Date().toISOString();
      const created: Proposal = {
        ...data,
        id: nextProposalId(submissions),
        createdAt: now,
        updatedAt: now,
        archived: false,
        statusHistory: [{ status: data.status, date: now }],
      };
      setSubmissions((prev) => [created, ...prev]);
      return created;
    },
    [submissions],
  );

  const updateProposal = useCallback(
    (id: string, data: SiteFormData & { lat?: number; lng?: number }) => {
      const now = new Date().toISOString();
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const statusChanged = s.status !== data.status;
          const statusHistory = statusChanged
            ? [...(s.statusHistory ?? []), { status: data.status, date: now }]
            : s.statusHistory;
          return { ...s, ...data, updatedAt: now, statusHistory };
        }),
      );
    },
    [],
  );

  const duplicateProposal = useCallback(
    (source: Proposal): string => {
      const now = new Date().toISOString();
      const newId = nextProposalId(submissions);
      const copy: Proposal = {
        ...source,
        id: newId,
        createdAt: now,
        updatedAt: now,
        archived: false,
        statusHistory: [{ status: source.status, date: now }],
      };
      setSubmissions((prev) => [copy, ...prev]);
      return newId;
    },
    [submissions],
  );

  /** Soft-delete (recoverable). */
  const archiveProposal = useCallback((id: string) => {
    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, archived: true, archivedAt: now } : s,
      ),
    );
  }, []);

  const archiveMany = useCallback((ids: string[]) => {
    const now = new Date().toISOString();
    const idSet = new Set(ids);
    setSubmissions((prev) =>
      prev.map((s) =>
        idSet.has(s.id) ? { ...s, archived: true, archivedAt: now } : s,
      ),
    );
  }, []);

  const restoreProposals = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setSubmissions((prev) =>
      prev.map((s) =>
        idSet.has(s.id) ? { ...s, archived: false, archivedAt: undefined } : s,
      ),
    );
  }, []);

  /** Permanently remove archived items (e.g. "empty trash"). */
  const purgeProposal = useCallback((id: string) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /** Attach geocoded coordinates to a proposal after the fact. */
  const patchCoordinates = useCallback(
    (id: string, lat: number, lng: number) => {
      setSubmissions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, lat, lng } : s)),
      );
    },
    [],
  );

  const persistStatuses = useCallback((next: StatusOption[]) => {
    setStatuses(next);
    storage.saveStatuses(next);
  }, []);

  const resetStatuses = useCallback(() => {
    setStatuses(STATUS_OPTIONS);
    storage.saveStatuses(STATUS_OPTIONS);
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    storage.saveSettings(next);
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecentSearches((prev) => {
      const next = [q, ...prev.filter((s) => s !== q)].slice(0, 5);
      storage.saveRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    storage.saveRecentSearches([]);
  }, []);

  return {
    submissions,
    active: submissions.filter((s) => !s.archived),
    archived: submissions.filter((s) => s.archived),
    statuses,
    recentSearches,
    settings,
    isDataLoaded,
    createProposal,
    updateProposal,
    duplicateProposal,
    archiveProposal,
    archiveMany,
    restoreProposals,
    purgeProposal,
    patchCoordinates,
    persistStatuses,
    resetStatuses,
    updateSettings,
    addRecentSearch,
    clearRecentSearches,
  };
}
