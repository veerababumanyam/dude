import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import type { Proposal, StatusOption } from "../types";
import { daysRemaining, isClosingSoon, isOverdue } from "../lib/proposals";
import { useTranslation } from "../i18n/context";

interface NotificationBellProps {
  proposals: Proposal[];
  statuses: StatusOption[];
  deadlineDays: number;
  onSelect: (p: Proposal) => void;
}

/**
 * Header notification center. Surfaces proposals that need attention (overdue
 * or closing soon); clicking an item opens that proposal's details.
 */
export function NotificationBell({
  proposals,
  statuses,
  deadlineDays,
  onSelect,
}: NotificationBellProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = useMemo(() => {
    return proposals
      .filter(
        (p) =>
          isOverdue(p, deadlineDays) || isClosingSoon(p, deadlineDays),
      )
      .map((p) => ({
        proposal: p,
        overdue: isOverdue(p, deadlineDays),
        days: daysRemaining(p, deadlineDays),
      }))
      .sort((a, b) => a.days - b.days);
  }, [proposals, deadlineDays]);

  const count = items.length;
  const statusColor = (value: string) =>
    statuses.find((s) => s.value === value)?.color ?? "#9c5354";

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={t("notif.title")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-full text-neutral-700 border backdrop-blur-md shadow-sm transition-all hover:text-neutral-900 hover:shadow-md active:scale-95 ${
          open
            ? "bg-white/90 border-brand-500/30 text-brand-700 shadow-md"
            : "bg-white/60 border-white/70 hover:bg-white/90"
        }`}
      >
        <Bell className="w-5 h-5" strokeWidth={2.25} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-status-error text-white text-[10px] font-bold leading-none shadow">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl overflow-hidden z-30"
          >
            <div className="px-4 py-3 border-b border-neutral-200/60">
              <p className="font-bold text-neutral-900">{t("notif.title")}</p>
            </div>

            {count === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-500">
                {t("notif.empty")}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto custom-scrollbar py-1">
                {items.map(({ proposal, overdue, days }) => (
                  <button
                    key={proposal.id}
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onSelect(proposal);
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/70 transition-colors"
                  >
                    <span
                      className="mt-1 w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: statusColor(proposal.status) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 truncate">
                        {proposal.siteName}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">
                        {proposal.id} · {t(`status.${proposal.status}`)}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold ${
                          overdue ? "text-status-error" : "text-amber-600"
                        }`}
                      >
                        {overdue ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {overdue
                          ? t("notif.overdue")
                          : t("notif.daysLeft", { n: days })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
