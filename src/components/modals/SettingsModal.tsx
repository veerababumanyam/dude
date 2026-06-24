import { useState } from "react";
import { Plus, Trash2, X, Check, Languages } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import type { AppSettings, StatusOption } from "../../types";
import { useTranslation, LANGUAGES } from "../../i18n/context";

interface SettingsModalProps {
  statuses: StatusOption[];
  settings: AppSettings;
  onSaveStatuses: (statuses: StatusOption[]) => void;
  onResetStatuses: () => void;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export function SettingsModal({
  statuses,
  settings,
  onSaveStatuses,
  onResetStatuses,
  onSaveSettings,
  onClose,
}: SettingsModalProps) {
  const { t, lang, setLang } = useTranslation();
  const [draftStatuses, setDraftStatuses] = useState<StatusOption[]>(statuses);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);

  const updateStatus = (i: number, patch: Partial<StatusOption>) => {
    setDraftStatuses((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  };

  const save = () => {
    onSaveStatuses(draftStatuses);
    onSaveSettings({
      ...draftSettings,
      deadlineDays: Math.max(1, Number(draftSettings.deadlineDays) || 90),
    });
    toast.success(t("settings.savedToast"));
    onClose();
  };

  return (
    <Modal
      onClose={onClose}
      className="max-w-2xl flex flex-col max-h-[90dvh]"
      labelledBy="settings-title"
    >
      <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
        <div>
          <h3
            id="settings-title"
            className="font-serif font-bold text-lg text-neutral-900"
          >
            {t("settings.title")}
          </h3>
          <p className="text-sm text-neutral-500">{t("settings.subtitle")}</p>
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8">
        <section>
          <div className="flex items-center gap-2 mb-1">
            <Languages className="w-5 h-5 text-brand-600" />
            <h4 className="font-bold text-neutral-900">
              {t("settings.languageHeading")}
            </h4>
          </div>
          <p className="text-sm text-neutral-500 mb-4">
            {t("settings.languageHelp")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {LANGUAGES.map((l) => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={active}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/30"
                      : "border-neutral-200 hover:bg-neutral-50"
                  }`}
                >
                  <span>
                    <span className="block font-bold text-neutral-900">
                      {l.native}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {l.label}
                    </span>
                  </span>
                  {active && (
                    <Check className="w-4 h-4 text-brand-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h4 className="font-bold text-neutral-900 mb-4">
            {t("settings.pipelineHeading")}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label={t("settings.conversionWindow")} htmlFor="deadlineDays">
              <Input
                id="deadlineDays"
                type="number"
                min="1"
                value={draftSettings.deadlineDays}
                onChange={(e) =>
                  setDraftSettings((s) => ({
                    ...s,
                    deadlineDays: Number(e.target.value),
                  }))
                }
                className="font-mono"
              />
            </Field>
            <Field label={t("settings.baseLat")} htmlFor="baseLat">
              <Input
                id="baseLat"
                type="number"
                step="0.0001"
                value={draftSettings.baseLat}
                onChange={(e) =>
                  setDraftSettings((s) => ({
                    ...s,
                    baseLat: Number(e.target.value),
                  }))
                }
                className="font-mono"
              />
            </Field>
            <Field label={t("settings.baseLng")} htmlFor="baseLng">
              <Input
                id="baseLng"
                type="number"
                step="0.0001"
                value={draftSettings.baseLng}
                onChange={(e) =>
                  setDraftSettings((s) => ({
                    ...s,
                    baseLng: Number(e.target.value),
                  }))
                }
                className="font-mono"
              />
            </Field>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-neutral-900">
                {t("settings.customStatuses")}
              </h4>
              <p className="text-sm text-neutral-500">
                {t("settings.customStatusesHelp")}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftStatuses((prev) => [
                  ...prev,
                  {
                    value: "New Status",
                    color: "#94a3b8",
                    bg: "bg-slate-100 text-slate-800 border-slate-200",
                  },
                ])
              }
            >
              <Plus className="w-4 h-4 mr-2" /> {t("settings.addStatus")}
            </Button>
          </div>

          <div className="space-y-3">
            {draftStatuses.map((s, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
              >
                <input
                  type="color"
                  aria-label={t("settings.statusColor")}
                  value={s.color}
                  onChange={(e) => updateStatus(i, { color: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0"
                />
                <input
                  type="text"
                  aria-label={t("settings.statusName")}
                  value={s.value}
                  onChange={(e) => updateStatus(i, { value: e.target.value })}
                  className="flex-1 min-w-[120px] bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm"
                />
                <button
                  aria-label={t("settings.removeStatus")}
                  onClick={() =>
                    setDraftStatuses((prev) =>
                      prev.filter((_, idx) => idx !== i),
                    )
                  }
                  className="p-2 text-status-error hover:bg-red-50 rounded shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  aria-label={t("settings.badgeClasses")}
                  value={s.bg}
                  placeholder={t("settings.badgeClassesPlaceholder")}
                  onChange={(e) => updateStatus(i, { bg: e.target.value })}
                  className="basis-full bg-white border border-neutral-300 rounded px-3 py-1.5 text-sm font-mono text-neutral-500"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end gap-3 shrink-0">
        <Button
          variant="outline"
          onClick={() => {
            onResetStatuses();
            toast.success(t("settings.resetToast"));
            onClose();
          }}
        >
          {t("settings.resetDefaults")}
        </Button>
        <Button onClick={save}>{t("settings.saveSettings")}</Button>
      </div>
    </Modal>
  );
}
