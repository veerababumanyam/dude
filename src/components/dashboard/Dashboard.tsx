import { useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  ChevronDown,
  BarChart2,
  Download,
  Plus,
  Loader2,
  Inbox,
  Bell,
  Trash2,
  FileDown,
  RotateCcw,
  Target,
  Briefcase,
  Clock,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Analytics } from "./Analytics";
import { ProposalCard } from "./ProposalCard";
import type { AppSettings, Proposal, StatusOption } from "../../types";
import { UNIT_TYPES, HANDOVER_INFO } from "../../constants";
import { formatCurrency } from "../../utils";
import { useTranslation } from "../../i18n/context";
import {
  daysRemaining,
  distanceKm,
  isClosingSoon,
  toCSV,
  downloadCSV,
} from "../../lib/proposals";

type SortOrder =
  | "date-desc"
  | "date-asc"
  | "window-asc"
  | "window-desc"
  | "val-desc"
  | "val-asc"
  | "status";

interface DashboardProps {
  proposals: Proposal[];
  statuses: StatusOption[];
  settings: AppSettings;
  isLoading: boolean;
  aiEnabled: boolean;
  recentSearches: string[];
  onAddRecentSearch: (q: string) => void;
  onClearRecentSearches: () => void;
  onCreate: () => void;
  onEdit: (p: Proposal) => void;
  onDuplicate: (p: Proposal) => void;
  onArchive: (p: Proposal) => void;
  onArchiveMany: (ids: string[]) => void;
  onView: (p: Proposal) => void;
  onHistory: (p: Proposal) => void;
  onEmail: (p: Proposal) => void;
  onAI: (p: Proposal) => void;
}

export function Dashboard(props: DashboardProps) {
  const { t } = useTranslation();
  const { proposals, statuses, settings, isLoading, aiEnabled } = props;
  const { deadlineDays, baseLat, baseLng } = settings;

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("date-desc");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [unitTypeFilter, setUnitTypeFilter] = useState<string[]>([]);
  const [handoverFilter, setHandoverFilter] = useState<string[]>([]);
  const [distanceRadius, setDistanceRadius] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggle = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const filtered = useMemo(() => {
    return proposals
      .filter((sub) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !sub.siteName.toLowerCase().includes(q) &&
            !sub.id.toLowerCase().includes(q) &&
            !sub.location.toLowerCase().includes(q)
          )
            return false;
        }
        if (statusFilter.length && !statusFilter.includes(sub.status))
          return false;
        if (unitTypeFilter.length && !unitTypeFilter.includes(sub.unitType))
          return false;
        if (handoverFilter.length && !handoverFilter.includes(sub.handoverType))
          return false;
        if (distanceRadius) {
          if (!sub.lat || !sub.lng) return false;
          if (distanceKm(baseLat, baseLng, sub.lat, sub.lng) > distanceRadius)
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        switch (sortOrder) {
          case "date-desc":
            return dateB - dateA;
          case "date-asc":
            return dateA - dateB;
          case "window-asc":
            return (
              daysRemaining(a, deadlineDays) - daysRemaining(b, deadlineDays)
            );
          case "window-desc":
            return (
              daysRemaining(b, deadlineDays) - daysRemaining(a, deadlineDays)
            );
          case "val-desc":
            return (b.quotationValue || 0) - (a.quotationValue || 0);
          case "val-asc":
            return (a.quotationValue || 0) - (b.quotationValue || 0);
          case "status":
            return (a.status || "").localeCompare(b.status || "");
          default:
            return 0;
        }
      });
  }, [
    proposals,
    searchQuery,
    statusFilter,
    unitTypeFilter,
    handoverFilter,
    distanceRadius,
    sortOrder,
    deadlineDays,
    baseLat,
    baseLng,
  ]);

  const totalActive = proposals.length;
  const totalPipelineValue = proposals.reduce(
    (sum, s) => sum + (s.quotationValue || 0),
    0,
  );
  const windows = proposals.map((s) => daysRemaining(s, deadlineDays));
  const avgWindow = windows.length
    ? Math.round(windows.reduce((a, b) => a + b, 0) / windows.length)
    : 0;
  const closingSoon = proposals.filter((s) => isClosingSoon(s, deadlineDays));

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      prev.length === filtered.length ? [] : filtered.map((s) => s.id),
    );

  const exportCSV = (items: Proposal[]) => {
    downloadCSV(toCSV(items, deadlineDays));
  };

  const hasActiveFilters =
    statusFilter.length > 0 ||
    unitTypeFilter.length > 0 ||
    handoverFilter.length > 0 ||
    distanceRadius !== "";

  return (
    <div className="space-y-6">
      <div className="md:hidden flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
            {t("shell.eyebrowDashboard")}
          </p>
          <h2 className="text-xl font-serif font-bold text-neutral-900 tracking-tight">
            {t("shell.titleDashboard")}
          </h2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Kpi
          color="blue"
          icon={Target}
          label={t("dashboard.kpiActiveProposals")}
          value={String(totalActive)}
        />
        <Kpi
          color="green"
          icon={Briefcase}
          label={t("dashboard.kpiPipelineValue")}
          value={formatCurrency(totalPipelineValue)}
        />
        <Kpi
          color="orange"
          icon={Clock}
          label={t("dashboard.kpiAvgConvWindow")}
          value={`${avgWindow} `}
          suffix={t("dashboard.kpiDays")}
        />
      </div>

      <AnimatePresence>
        {showAnalytics && (
          <Analytics
            proposals={proposals}
            statuses={statuses}
            baseLat={baseLat}
            baseLng={baseLng}
          />
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-col gap-4 bg-white p-3 md:p-4 rounded-xl border border-brand-500/10 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("dashboard.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    props.onAddRecentSearch(searchQuery);
                    setShowRecentSearches(false);
                  }
                }}
                onFocus={() => setShowRecentSearches(true)}
                onBlur={() =>
                  setTimeout(() => setShowRecentSearches(false), 200)
                }
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              <AnimatePresence>
                {showRecentSearches && props.recentSearches.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 shadow-lg rounded-lg overflow-hidden z-20"
                  >
                    <div className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100 flex items-center justify-between">
                      <span>{t("dashboard.recentSearches")}</span>
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          props.onClearRecentSearches();
                        }}
                        className="hover:text-brand-600 transition-colors"
                      >
                        {t("dashboard.clear")}
                      </button>
                    </div>
                    {props.recentSearches.map((search, idx) => (
                      <button
                        key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSearchQuery(search);
                          props.onAddRecentSearch(search);
                          setShowRecentSearches(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                        {search}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant={showFilters ? "primary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3"
              aria-label={t("dashboard.toggleFilters")}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <select
                aria-label={t("dashboard.sortOrder")}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-full sm:w-auto appearance-none pl-4 pr-10 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="date-desc">{t("dashboard.sortNewest")}</option>
                <option value="date-asc">{t("dashboard.sortOldest")}</option>
                <option value="window-asc">
                  {t("dashboard.sortClosingSoon")}
                </option>
                <option value="window-desc">
                  {t("dashboard.sortClosingLater")}
                </option>
                <option value="val-desc">
                  {t("dashboard.sortValueHighLow")}
                </option>
                <option value="val-asc">
                  {t("dashboard.sortValueLowHigh")}
                </option>
                <option value="status">{t("dashboard.sortStatus")}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`hidden sm:flex whitespace-nowrap transition-colors ${
                showAnalytics
                  ? "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100 hover:text-brand-800"
                  : ""
              }`}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              {showAnalytics
                ? t("dashboard.hideInsights")
                : t("dashboard.showInsights")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCSV(proposals)}
              className="hidden sm:flex whitespace-nowrap"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("dashboard.exportCsv")}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-neutral-100 overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FilterGroup title={t("dashboard.filterStatus")}>
                  {statuses.map((status) => (
                    <FilterCheck
                      key={status.value}
                      label={t(`status.${status.value}`)}
                      checked={statusFilter.includes(status.value)}
                      onChange={() =>
                        setStatusFilter((p) => toggle(p, status.value))
                      }
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title={t("dashboard.filterPropertyType")}>
                  {UNIT_TYPES.map((type) => (
                    <FilterCheck
                      key={type}
                      label={t(`unit.${type}`)}
                      checked={unitTypeFilter.includes(type)}
                      onChange={() => setUnitTypeFilter((p) => toggle(p, type))}
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title={t("dashboard.filterHandoverInfo")}>
                  {HANDOVER_INFO.map((info) => (
                    <FilterCheck
                      key={info}
                      label={t(`handover.${info}`)}
                      checked={handoverFilter.includes(info)}
                      onChange={() => setHandoverFilter((p) => toggle(p, info))}
                    />
                  ))}
                </FilterGroup>
                <FilterGroup title={t("dashboard.filterDistanceFromBase")}>
                  <select
                    aria-label={t("dashboard.distanceFromBase")}
                    className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={distanceRadius}
                    onChange={(e) =>
                      setDistanceRadius(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                  >
                    <option value="">{t("dashboard.anyDistance")}</option>
                    <option value="5">
                      {t("dashboard.withinKm", { n: 5 })}
                    </option>
                    <option value="10">
                      {t("dashboard.withinKm", { n: 10 })}
                    </option>
                    <option value="25">
                      {t("dashboard.withinKm", { n: 25 })}
                    </option>
                    <option value="50">
                      {t("dashboard.withinKm", { n: 50 })}
                    </option>
                    <option value="100">
                      {t("dashboard.withinKm", { n: 100 })}
                    </option>
                  </select>
                </FilterGroup>
              </div>
              {hasActiveFilters && (
                <div className="flex justify-end mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter([]);
                      setUnitTypeFilter([]);
                      setHandoverFilter([]);
                      setDistanceRadius("");
                    }}
                  >
                    {t("dashboard.clearAllFilters")}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-brand-50 p-3 rounded-xl border border-brand-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="bg-brand-100 text-brand-700 px-2 py-1 rounded-md text-sm font-bold">
                {t("dashboard.selected", { n: selectedIds.length })}
              </div>
              <button
                onClick={() => setSelectedIds([])}
                className="text-sm text-brand-600 hover:text-brand-800 font-medium"
              >
                {t("dashboard.clearSelection")}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => {
                  exportCSV(
                    proposals.filter((s) => selectedIds.includes(s.id)),
                  );
                  setSelectedIds([]);
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />{" "}
                {t("dashboard.exportSelected")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-status-error border-red-200 hover:bg-red-50 hover:text-status-error"
                onClick={() => {
                  props.onArchiveMany(selectedIds);
                  setSelectedIds([]);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />{" "}
                {t("dashboard.archiveSelected")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectAll}
            aria-label={t("dashboard.selectAll")}
            className={`flex items-center justify-center w-5 h-5 rounded border ${
              selectedIds.length > 0 && selectedIds.length === filtered.length
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-neutral-300 text-transparent hover:border-brand-400"
            } transition-colors`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <span className="text-sm font-medium text-neutral-500 ml-1">
            {t("dashboard.selectAllCount", { n: filtered.length })}
          </span>
        </div>
      </div>

      {closingSoon.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 shadow-sm">
          <div className="p-2 bg-amber-100 rounded-lg shrink-0">
            <Bell className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">
              {t("dashboard.tasksDueTitle")}
            </h3>
            <p className="text-sm text-amber-800">
              {t("dashboard.tasksDueBody", { n: closingSoon.length })}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-neutral-900 mb-1">
            {t("dashboard.processingData")}
          </h3>
          <p className="text-neutral-500 text-sm">
            {t("dashboard.processingDataBody")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-brand-500/10 shadow-sm">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <Inbox className="w-10 h-10 text-brand-500" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
            {t("dashboard.noProposalsFound")}
          </h3>
          <p className="text-neutral-500 max-w-md mx-auto mb-8">
            {searchQuery || hasActiveFilters
              ? t("dashboard.noProposalsFiltered")
              : t("dashboard.noProposalsEmpty")}
          </p>
          {searchQuery || hasActiveFilters ? (
            <Button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter([]);
                setUnitTypeFilter([]);
                setHandoverFilter([]);
                setDistanceRadius("");
              }}
              variant="outline"
            >
              {t("dashboard.clearSearchAndFilters")}
            </Button>
          ) : (
            <Button
              onClick={props.onCreate}
              className="shadow-lg shadow-brand-700/20"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t("dashboard.createFirstProposal")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filtered.map((sub) => (
              <ProposalCard
                key={sub.id}
                sub={sub}
                statuses={statuses}
                deadlineDays={deadlineDays}
                aiEnabled={aiEnabled}
                selected={selectedIds.includes(sub.id)}
                onToggleSelect={(id) =>
                  setSelectedIds((prev) => toggle(prev, id))
                }
                onView={props.onView}
                onEdit={props.onEdit}
                onHistory={props.onHistory}
                onDuplicate={props.onDuplicate}
                onEmail={props.onEmail}
                onAI={props.onAI}
                onArchive={props.onArchive}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function Kpi({
  color,
  icon: Icon,
  label,
  value,
  suffix,
}: {
  color: "blue" | "green" | "orange";
  icon: typeof Target;
  label: string;
  value: string;
  suffix?: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-brand-500/10 shadow-sm flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colors[color]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-bold text-neutral-500">{label}</p>
        <p className="text-2xl font-serif font-bold text-neutral-900">
          {value}
          {suffix && (
            <span className="text-sm font-sans font-medium text-neutral-500">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">
        {title}
      </h4>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function FilterCheck({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer group">
      <input
        type="checkbox"
        className="rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
        checked={checked}
        onChange={onChange}
      />
      <span className="group-hover:text-neutral-900">{label}</span>
    </label>
  );
}
