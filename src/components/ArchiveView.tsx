import { Archive, RotateCcw, Trash2, MapPin } from "lucide-react";
import { Button } from "./ui/Button";
import type { Proposal, StatusOption } from "../types";
import { formatCurrency } from "../utils";
import { getStatusBg } from "../lib/proposals";
import { useTranslation } from "../i18n/context";

interface ArchiveViewProps {
  proposals: Proposal[];
  statuses: StatusOption[];
  onRestore: (id: string) => void;
  onPurge: (id: string) => void;
}

export function ArchiveView({
  proposals,
  statuses,
  onRestore,
  onPurge,
}: ArchiveViewProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
          {t("shell.eyebrowArchive")}
        </p>
        <h2 className="text-xl font-serif font-bold text-neutral-900 tracking-tight">
          {t("shell.titleArchive")}
        </h2>
      </div>

      {proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white rounded-2xl border border-brand-500/10 shadow-sm">
          <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
            <Archive className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-2">
            {t("dashboard.archiveEmpty")}
          </h3>
          <p className="text-neutral-500 max-w-md mx-auto">
            {t("dashboard.archiveEmptyBody")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {proposals.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-brand-500/10 shadow-sm flex flex-col opacity-90"
            >
              <div className="p-6 flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
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
                </div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {sub.siteName}
                </h3>
                <div className="flex items-center text-sm font-medium text-neutral-600">
                  <MapPin className="w-4 h-4 mr-1 text-brand-500" />
                  {sub.location}
                </div>
                <div className="font-bold text-brand-700 font-mono">
                  {formatCurrency(sub.quotationValue)}
                </div>
              </div>
              <div className="p-4 border-t border-brand-500/10 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onRestore(sub.id)}
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> {t("dashboard.restore")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-status-error border-red-200 hover:bg-red-50 hover:text-status-error"
                  onClick={() => onPurge(sub.id)}
                  aria-label={t("dashboard.deletePermanently")}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
