import { Sparkles, X, Loader2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useTranslation } from "../../i18n/context";

interface AIModalProps {
  title: string;
  loading: boolean;
  content: string;
  error?: string | null;
  /** When set, shows a "Send via email" action that opens the mail client. */
  mailto?: string;
  onClose: () => void;
}

export function AIModal({
  title,
  loading,
  content,
  error,
  mailto,
  onClose,
}: AIModalProps) {
  const { t } = useTranslation();
  const copy = async () => {
    await navigator.clipboard.writeText(content);
    toast.success(t("modals.copiedToClipboard"));
  };

  return (
    <Modal onClose={onClose} className="max-w-lg" labelledBy="ai-title">
      <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-gradient-to-r from-brand-50 to-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-700" />
          <h3
            id="ai-title"
            className="font-serif font-bold text-lg text-neutral-900"
          >
            {title}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 max-h-[60vh] overflow-y-auto min-h-[160px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
            <p className="text-sm">{t("modals.generating")}</p>
          </div>
        ) : error ? (
          <div className="text-status-error text-sm bg-red-50 border border-red-100 rounded-lg p-4">
            {error}
          </div>
        ) : (
          <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        )}
      </div>
      {!loading && !error && (
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy className="w-4 h-4 mr-2" /> {t("modals.copy")}
          </Button>
          {mailto && (
            <Button onClick={() => (window.location.href = mailto)}>
              <Mail className="w-4 h-4 mr-2" /> {t("modals.openInEmail")}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
