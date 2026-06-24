import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Menu,
  LayoutDashboard,
  FileText,
  Archive,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "../i18n/context";

type View = "dashboard" | "form" | "archive";

interface MobileNavMenuProps {
  view: View;
  onDashboard: () => void;
  onCreate: () => void;
  onArchive: () => void;
  onSettings: () => void;
  archivedCount: number;
}

/**
 * Mirrors the desktop sidebar navigation as a liquid-glass dropdown in the
 * mobile header, giving quick access to every destination (incl. Settings).
 */
export function MobileNavMenu({
  view,
  onDashboard,
  onCreate,
  onArchive,
  onSettings,
  archivedCount,
}: MobileNavMenuProps) {
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

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  const Item = ({
    icon: Icon,
    label,
    active,
    onClick,
    badge,
  }: {
    icon: LucideIcon;
    label: string;
    active?: boolean;
    onClick: () => void;
    badge?: number;
  }) => (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-bold transition-colors ${
        active
          ? "bg-brand-50/80 text-brand-700"
          : "text-neutral-700 hover:bg-white/60"
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-xs bg-neutral-200/80 text-neutral-700 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={t("shell.navMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`p-2 rounded-full text-neutral-700 border backdrop-blur-md shadow-sm transition-all hover:text-neutral-900 hover:shadow-md active:scale-95 ${
          open
            ? "bg-white/90 border-brand-500/30 text-brand-700 shadow-md"
            : "bg-white/60 border-white/70 hover:bg-white/90"
        }`}
      >
        <Menu className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-56 bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-2xl p-1.5 z-30"
          >
            <Item
              icon={LayoutDashboard}
              label={t("shell.navDashboard")}
              active={view === "dashboard"}
              onClick={() => run(onDashboard)}
            />
            <Item
              icon={FileText}
              label={t("shell.navNewProposal")}
              active={view === "form"}
              onClick={() => run(onCreate)}
            />
            <Item
              icon={Archive}
              label={t("shell.navArchive")}
              active={view === "archive"}
              badge={archivedCount}
              onClick={() => run(onArchive)}
            />
            <div className="h-px bg-neutral-200/70 my-1.5 mx-2" />
            <Item
              icon={Settings}
              label={t("shell.navSettings")}
              onClick={() => run(onSettings)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
