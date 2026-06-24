import { LayoutDashboard, FileText, Settings, Archive } from "lucide-react";
import dudeLogo from "@/DudeLogo.png";
import type { Profile } from "../constants";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { useTranslation } from "../i18n/context";

type View = "dashboard" | "form" | "archive";

interface SidebarProps {
  view: View;
  onDashboard: () => void;
  onCreate: () => void;
  onArchive: () => void;
  onSettings: () => void;
  archivedCount: number;
  profile: Profile;
  profiles: Profile[];
  onSelectProfile: (id: string) => void;
}

export function Sidebar({
  view,
  onDashboard,
  onCreate,
  onArchive,
  onSettings,
  archivedCount,
  profile,
  profiles,
  onSelectProfile,
}: SidebarProps) {
  const { t } = useTranslation();
  const navClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
      active
        ? "bg-brand-50 text-brand-700"
        : "text-neutral-600 hover:bg-brand-50/50"
    }`;

  return (
    <aside className="hidden md:flex w-64 bg-white border-r border-brand-500/20 flex-col shrink-0 z-20">
      <div className="p-8 flex items-center gap-3">
        <button
          onClick={onDashboard}
          aria-label={t("shell.navDashboard")}
          className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
        >
          <img src={dudeLogo} alt="Dude" className="h-10 w-auto" />
          <span className="font-serif text-2xl font-bold text-brand-700">
            Dude
          </span>
        </button>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <button
          onClick={onDashboard}
          className={navClass(view === "dashboard")}
        >
          <LayoutDashboard className="w-5 h-5" />
          {t("shell.navDashboard")}
        </button>
        <button onClick={onCreate} className={navClass(view === "form")}>
          <FileText className="w-5 h-5" />
          {t("shell.navNewProposal")}
        </button>
        <button onClick={onArchive} className={navClass(view === "archive")}>
          <Archive className="w-5 h-5" />
          <span className="flex-1 text-left">{t("shell.navArchive")}</span>
          {archivedCount > 0 && (
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              {archivedCount}
            </span>
          )}
        </button>
        <button onClick={onSettings} className={navClass(false)}>
          <Settings className="w-5 h-5" />
          {t("shell.navSettings")}
        </button>
      </nav>
      <div className="p-6 border-t border-brand-500/10">
        <ProfileSwitcher
          profile={profile}
          profiles={profiles}
          onSelect={onSelectProfile}
          variant="sidebar"
        />
      </div>
    </aside>
  );
}
