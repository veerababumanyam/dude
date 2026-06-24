import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { Profile } from "../constants";
import { useTranslation } from "../i18n/context";

interface ProfileSwitcherProps {
  profile: Profile;
  profiles: Profile[];
  onSelect: (id: string) => void;
  /** `sidebar` = full footer card (desktop); `compact` = avatar only (mobile). */
  variant?: "sidebar" | "compact";
}

export function ProfileSwitcher({
  profile,
  profiles,
  onSelect,
  variant = "sidebar",
}: ProfileSwitcherProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click.
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

  const Avatar = ({ p, size }: { p: Profile; size: "sm" | "md" }) => (
    <div
      className={`rounded-full bg-brand-500 border-2 border-white shadow-sm flex items-center justify-center text-white font-bold shrink-0 ${
        size === "md" ? "w-10 h-10 text-sm" : "w-9 h-9 text-xs"
      }`}
    >
      {p.initials}
    </div>
  );

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="menu"
          initial={{ opacity: 0, scale: 0.95, y: variant === "sidebar" ? 4 : -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`absolute w-60 bg-white border border-brand-500/10 shadow-xl rounded-xl py-1 z-30 ${
            variant === "sidebar"
              ? "bottom-full mb-2 left-0"
              : "top-full mt-2 right-0"
          }`}
        >
          <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {t("shell.switchProfile")}
          </p>
          {profiles.map((p) => {
            const active = p.id === profile.id;
            return (
              <button
                key={p.id}
                role="menuitem"
                onClick={() => {
                  onSelect(p.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  active ? "bg-brand-50" : "hover:bg-neutral-50"
                }`}
              >
                <Avatar p={p} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-neutral-600 truncate">
                    {t(`profileRole.${p.role}`)}
                  </p>
                </div>
                {active && (
                  <Check className="w-4 h-4 text-brand-600 shrink-0" />
                )}
              </button>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (variant === "compact") {
    return (
      <div className="relative" ref={ref}>
        <button
          aria-label={t("shell.switchProfileAria")}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <Avatar p={profile} size="md" />
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label={t("shell.switchProfileAria")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-xl p-1 -m-1 hover:bg-brand-50/50 transition-colors"
      >
        <Avatar p={profile} size="md" />
        <div className="text-left flex-1 min-w-0">
          <p className="text-sm font-bold text-neutral-900 leading-tight truncate">
            {profile.name}
          </p>
          <p className="text-xs text-neutral-600 truncate">
            {t(`profileRole.${profile.role}`)}
          </p>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
      </button>
      {menu}
    </div>
  );
}
