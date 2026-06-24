import { format } from "date-fns";
import { History, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Proposal } from "../../types";
import { useTranslation } from "../../i18n/context";

export function HistoryModal({
  proposal,
  onClose,
}: {
  proposal: Proposal;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const history = proposal.statusHistory ?? [];
  return (
    <Modal onClose={onClose} className="max-w-md" labelledBy="history-title">
      <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
        <div>
          <h3
            id="history-title"
            className="font-serif font-bold text-lg text-neutral-900"
          >
            {t("modals.statusHistory")}
          </h3>
          <p className="text-sm text-neutral-500 font-mono">{proposal.id}</p>
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <div className="space-y-6">
          {history.length > 0 ? (
            history.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                  {index < history.length - 1 && (
                    <div className="w-px h-full bg-neutral-200 mt-2 mb-1" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-neutral-900">
                    {t(`status.${item.status}`)}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {format(new Date(item.date), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <History className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
              <p>{t("modals.noHistoryRecorded")}</p>
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
        <Button onClick={onClose}>{t("common.close")}</Button>
      </div>
    </Modal>
  );
}
