import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Briefcase,
  MoreVertical,
  Eye,
  Edit2,
  History,
  Copy,
  Mail,
  Download,
  Sparkles,
  Trash2,
  Bell,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { Proposal, StatusOption } from "../../types";
import { formatCurrency } from "../../utils";
import {
  daysRemaining,
  getStatusBg,
  isClosingSoon,
  isOverdue,
} from "../../lib/proposals";
import { downloadProposalPdf } from "../../lib/pdf";
import { useTranslation } from "../../i18n/context";

interface ProposalCardProps {
  sub: Proposal;
  statuses: StatusOption[];
  deadlineDays: number;
  selected: boolean;
  aiEnabled: boolean;
  onToggleSelect: (id: string) => void;
  onView: (sub: Proposal) => void;
  onEdit: (sub: Proposal) => void;
  onHistory: (sub: Proposal) => void;
  onDuplicate: (sub: Proposal) => void;
  onEmail: (sub: Proposal) => void;
  onAI: (sub: Proposal) => void;
  onArchive: (sub: Proposal) => void;
}

export function ProposalCard({
  sub,
  statuses,
  deadlineDays,
  selected,
  aiEnabled,
  onToggleSelect,
  onView,
  onEdit,
  onHistory,
  onDuplicate,
  onEmail,
  onAI,
  onArchive,
}: ProposalCardProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the action menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const remaining = daysRemaining(sub, deadlineDays);
  const needsAlert = isClosingSoon(sub, deadlineDays);
  const overdue = isOverdue(sub, deadlineDays);

  const runAction = (fn: (s: Proposal) => void) => {
    setMenuOpen(false);
    fn(sub);
  };

  const handlePdf = async () => {
    setMenuOpen(false);
    const id = toast.loading(t("modals.pdfGenerating"));
    try {
      await downloadProposalPdf(sub, statuses);
      toast.dismiss(id);
    } catch (e) {
      console.error("PDF export failed", e);
      toast.error(t("modals.pdfError"), { id });
    }
  };

  return (
    <motion.div
      key={sub.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_e, { offset }) => {
        // Swipe left to archive only; right swipe snaps back.
        if (offset.x < -120) onArchive(sub);
      }}
      role="button"
      tabIndex={0}
      aria-label={t("dashboard.viewDetails")}
      onClick={() => onView(sub)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(sub);
        }
      }}
      className="group bg-white rounded-2xl border border-brand-500/10 shadow-sm flex flex-col relative cursor-pointer transition-all hover:shadow-lg hover:border-brand-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      style={{ touchAction: "pan-y" }}
    >
      <div className="p-6 flex-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="pt-1">
              <button
                aria-label={
                  selected
                    ? t("dashboard.deselectProposal")
                    : t("dashboard.selectProposal")
                }
                aria-pressed={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(sub.id);
                }}
                className={`flex items-center justify-center w-5 h-5 rounded border ${
                  selected
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
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-neutral-600">
                  {sub.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusBg(
                    statuses,
                    sub.status,
                  )}`}
                >
                  {t(`status.${sub.status}`)}
                </span>
                {sub.priority && (
                  <span
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                      sub.priority === "High"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : sub.priority === "Medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {t("dashboard.priorityLabel", {
                      level: t(`dashboard.priority.${sub.priority}`),
                    })}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                {sub.siteName}
              </h3>
              <div className="flex items-center text-sm font-medium text-neutral-600 mt-1">
                <MapPin className="w-4 h-4 mr-1 text-brand-500" />
                {sub.location}
              </div>
            </div>
          </div>
          <div
            className="relative"
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label={t("dashboard.proposalActions")}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={`p-2 rounded-full text-neutral-700 border backdrop-blur-md shadow-sm transition-all hover:text-neutral-900 hover:shadow-md active:scale-95 ${
                menuOpen
                  ? "bg-white/90 border-brand-500/30 text-brand-700 shadow-md"
                  : "bg-white/60 border-white/70 hover:bg-white/90"
              }`}
            >
              <MoreVertical className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-xl py-1 z-10"
                >
                  <MenuItem
                    icon={Eye}
                    label={t("dashboard.viewDetails")}
                    onClick={() => runAction(onView)}
                  />
                  <MenuItem
                    icon={Edit2}
                    label={t("dashboard.editProposal")}
                    onClick={() => runAction(onEdit)}
                  />
                  <MenuItem
                    icon={History}
                    label={t("dashboard.statusHistory")}
                    onClick={() => runAction(onHistory)}
                  />
                  <MenuItem
                    icon={Copy}
                    label={t("dashboard.duplicate")}
                    onClick={() => runAction(onDuplicate)}
                  />
                  <MenuItem
                    icon={Mail}
                    label={t("dashboard.emailClient")}
                    onClick={() => runAction(onEmail)}
                  />
                  <MenuItem
                    icon={Download}
                    label={t("dashboard.downloadPdf")}
                    onClick={handlePdf}
                  />
                  {aiEnabled && (
                    <MenuItem
                      icon={Sparkles}
                      label={t("dashboard.aiSummary")}
                      onClick={() => runAction(onAI)}
                    />
                  )}
                  <div className="h-px bg-neutral-100 my-1" />
                  <button
                    role="menuitem"
                    onClick={() => runAction(onArchive)}
                    className="w-full text-left px-4 py-2 text-sm text-status-error hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t("dashboard.archive")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm pt-2">
          <div className="flex items-center gap-1.5 font-bold text-neutral-700">
            <Briefcase className="w-4 h-4 text-brand-500" />
            <span>
              {t("dashboard.servicesCount", { n: sub.services?.length || 0 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-brand-700 font-mono text-base">
            {formatCurrency(sub.quotationValue)}
          </div>
        </div>
      </div>

      <div
        className={`p-4 border-t border-brand-500/10 flex items-center justify-between ${
          needsAlert
            ? "bg-brand-50"
            : overdue
              ? "bg-red-50/50"
              : "bg-neutral-50/50"
        }`}
      >
        <div>
          <div className="text-[10px] font-bold text-neutral-600 uppercase tracking-tighter mb-0.5">
            {t("dashboard.conversionWindow")}
          </div>
          {overdue ? (
            <div className="text-sm font-mono font-bold text-status-error">
              {t("dashboard.expired")}
            </div>
          ) : (
            <div className="text-sm font-mono font-bold text-brand-700">
              {t("dashboard.daysRemaining", { n: remaining })}
            </div>
          )}
        </div>
        {needsAlert && (
          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-1 rounded-md shadow-sm">
            <Bell className="w-3 h-3" />
            {t("dashboard.tasksDueFollowUp")}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 font-medium"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
