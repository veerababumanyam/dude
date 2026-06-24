import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "motion/react";
import { Plus, ArrowLeft } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { toast } from "sonner";

import { siteFormSchema, type SiteFormData } from "./schema";
import type { Proposal } from "./types";
import { useProposals } from "./hooks/useProposals";
import { useProfile } from "./hooks/useProfile";
import { useAuth } from "./hooks/useAuth";
import { isAIEnabled, summarizeProposal } from "./lib/ai";
import { searchPlaces } from "./lib/geocode";
import { proposalPdfBlob, pdfFilename } from "./lib/pdf";
import { useTranslation } from "./i18n/context";

import { Sidebar } from "./components/Sidebar";
import { LoginScreen } from "./components/LoginScreen";
import { ProfileSwitcher } from "./components/ProfileSwitcher";
import { MobileNavMenu } from "./components/MobileNavMenu";
import { NotificationBell } from "./components/NotificationBell";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ArchiveView } from "./components/ArchiveView";
import { Button } from "./components/ui/Button";
import { FormSectionA } from "./components/FormSectionA";
import { FormSectionB } from "./components/FormSectionB";
import { FormSectionC } from "./components/FormSectionC";
import { FormSectionD } from "./components/FormSectionD";
import { HistoryModal } from "./components/modals/HistoryModal";
import { DetailsModal } from "./components/modals/DetailsModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { AIModal } from "./components/modals/AIModal";
import dudeLogo from "@/DudeLogo.png";

import * as storage from "./lib/storage";

// Fix Leaflet's default marker icon resolution under bundlers.
L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type View = "dashboard" | "form" | "archive";

interface AIState {
  open: boolean;
  title: string;
  loading: boolean;
  content: string;
  error: string | null;
  mailto?: string;
}

const EMPTY_FORM = { services: [], timings: [], pestControl: false };

export default function App() {
  const { t } = useTranslation();
  const auth = useAuth();
  const proposals = useProposals();
  const { active, archived, statuses, settings, recentSearches, isDataLoaded } =
    proposals;
  const { profile, profiles, selectProfile } = useProfile();

  const [view, setView] = useState<View>("dashboard");
  const [editingId, setEditingId] = useState<string | null>(null);
  const aiEnabled = isAIEnabled();

  const [historyModal, setHistoryModal] = useState<Proposal | null>(null);
  const [detailsModal, setDetailsModal] = useState<Proposal | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [ai, setAI] = useState<AIState>({
    open: false,
    title: "",
    loading: false,
    content: "",
    error: null,
  });

  const methods = useForm<SiteFormData>({
    // Cast: zod `preprocess` makes the schema's input type differ from its
    // output type, which the resolver generic can't reconcile on its own.
    resolver: zodResolver(siteFormSchema) as any,
    defaultValues: EMPTY_FORM as any,
  });

  // Auto-save the draft while creating a new proposal.
  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (view === "form" && !editingId) storage.saveDraft(value);
    });
    return () => subscription.unsubscribe();
  }, [methods, view, editingId]);

  const handleCreateNew = async () => {
    setEditingId(null);
    const draft = await storage.loadDraft();
    methods.reset((draft as any) ?? (EMPTY_FORM as any));
    setView("form");
  };

  const handleEdit = (sub: Proposal) => {
    setEditingId(sub.id);
    methods.reset(sub as any);
    setView("form");
  };

  const onSubmit = (data: SiteFormData) => {
    // lat/lng live outside the validated schema (set by the location picker).
    const { lat, lng } = methods.getValues() as any;
    const payload = { ...data, lat, lng };
    let savedId = editingId;
    if (editingId) {
      proposals.updateProposal(editingId, payload);
      toast.success(t("shell.proposalUpdated", { id: editingId }));
      setEditingId(null);
    } else {
      const created = proposals.createProposal(payload);
      savedId = created.id;
      toast.success(t("shell.proposalCreated", { id: created.id }));
    }
    methods.reset(EMPTY_FORM as any);
    storage.clearDraft();
    setView("dashboard");

    // If no pin was dropped, geocode the typed location so the proposal still
    // appears on the site map (with real coordinates rather than a guess).
    if ((lat == null || lng == null) && data.location && savedId) {
      const id = savedId;
      searchPlaces(data.location)
        .then((results) => {
          if (results.length) {
            proposals.patchCoordinates(id, results[0].lat, results[0].lng);
          }
        })
        .catch(() => {});
    }
  };

  const handleArchive = (sub: Proposal) => {
    proposals.archiveProposal(sub.id);
    toast.success(t("shell.proposalArchived", { id: sub.id }), {
      action: {
        label: t("shell.undo"),
        onClick: () => proposals.restoreProposals([sub.id]),
      },
    });
  };

  const handleArchiveMany = (ids: string[]) => {
    proposals.archiveMany(ids);
    toast.success(t("shell.proposalsArchived", { count: ids.length }), {
      action: {
        label: t("shell.undo"),
        onClick: () => proposals.restoreProposals(ids),
      },
    });
  };

  const handleDuplicate = (sub: Proposal) => {
    const newId = proposals.duplicateProposal(sub);
    toast.success(t("shell.proposalDuplicated", { id: newId }));
  };

  const runAISummary = async (sub: Proposal) => {
    setDetailsModal(null);
    setAI({
      open: true,
      title: t("shell.aiSummaryTitle"),
      loading: true,
      content: "",
      error: null,
    });
    try {
      const content = await summarizeProposal(sub);
      setAI((s) => ({ ...s, loading: false, content }));
    } catch (e) {
      setAI((s) => ({ ...s, loading: false, error: (e as Error).message }));
    }
  };

  const handleEmail = async (sub: Proposal) => {
    const subject = t("shell.emailSubject", {
      id: sub.id,
      siteName: sub.siteName,
    });
    const body = t("shell.emailBody", {
      siteName: sub.siteName,
      location: sub.location,
    });
    const toastId = toast.loading(t("shell.emailPreparing"));
    try {
      const blob = await proposalPdfBlob(sub, statuses, t);
      const file = new File([blob], pdfFilename(sub), {
        type: "application/pdf",
      });

      // Preferred: native share sheet (mobile + supported desktop) opens the
      // mail app with the PDF already attached.
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        toast.dismiss(toastId);
        await navigator.share({ files: [file], title: subject, text: body });
        return;
      }

      // Fallback: mailto cannot carry attachments, so download the PDF and open
      // the mail composer prompting the user to attach the downloaded copy.
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = pdfFilename(sub);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(body)}`;
      toast.success(t("shell.emailPdfDownloaded"), { id: toastId });
    } catch (e) {
      // User dismissing the native share sheet is not an error.
      if ((e as Error)?.name === "AbortError") {
        toast.dismiss(toastId);
        return;
      }
      console.error("Email preparation failed", e);
      toast.error(t("shell.emailError"), { id: toastId });
    }
  };

  // Local login gate: hide the entire app until authenticated. The flag is
  // persisted in the browser DB, so this is a one-time step per browser.
  if (!auth.isLoaded) return null;
  if (!auth.authed) return <LoginScreen onLogin={auth.login} />;

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-neutral-50 font-sans text-neutral-900">
      <Sidebar
        view={view}
        archivedCount={archived.length}
        onDashboard={() => setView("dashboard")}
        onCreate={handleCreateNew}
        onArchive={() => setView("archive")}
        onSettings={() => setShowSettings(true)}
        profile={profile}
        profiles={profiles}
        onSelectProfile={selectProfile}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-brand-500/10 flex items-center justify-between px-4 h-16 shrink-0 z-20 shadow-sm">
          <button
            onClick={() => setView("dashboard")}
            aria-label={t("shell.navDashboard")}
            className="flex items-center gap-2 text-brand-700 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
          >
            <img src={dudeLogo} alt="Dude" className="h-8 w-auto" />
            <span className="font-serif text-xl font-bold text-brand-700">
              Dude
            </span>
          </button>
          <div className="flex items-center gap-2">
            {view === "dashboard" ? (
              <Button size="sm" onClick={handleCreateNew} className="shadow-sm">
                <Plus className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("dashboard")}
                className="text-brand-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <NotificationBell
              proposals={active}
              statuses={statuses}
              deadlineDays={settings.deadlineDays}
              onSelect={setDetailsModal}
            />
            <MobileNavMenu
              view={view}
              archivedCount={archived.length}
              onDashboard={() => setView("dashboard")}
              onCreate={handleCreateNew}
              onArchive={() => setView("archive")}
              onSettings={() => setShowSettings(true)}
            />
            <ProfileSwitcher
              profile={profile}
              profiles={profiles}
              onSelect={selectProfile}
              variant="compact"
            />
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-white/80 backdrop-blur-md border-b border-brand-500/10 items-center justify-between px-8 shrink-0 z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
              {view === "form"
                ? t("shell.eyebrowForm")
                : view === "archive"
                  ? t("shell.eyebrowArchive")
                  : t("shell.eyebrowDashboard")}
            </p>
            <h2 className="text-xl font-serif font-bold text-neutral-900">
              {view === "form"
                ? t("shell.titleForm")
                : view === "archive"
                  ? t("shell.titleArchive")
                  : t("shell.titleDashboard")}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              proposals={active}
              statuses={statuses}
              deadlineDays={settings.deadlineDays}
              onSelect={setDetailsModal}
            />
            {view === "form" ? (
              <>
                <Button variant="outline" onClick={() => setView("dashboard")}>
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  form="proposal-form"
                  className="shadow-lg shadow-brand-700/20"
                >
                  {t("shell.saveEntry")}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreateNew}
                className="shadow-lg shadow-brand-700/20"
              >
                <Plus className="w-5 h-5 mr-1.5" />
                {t("shell.newQuotation")}
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 bg-neutral-50">
          <div className="max-w-6xl mx-auto">
            {view === "dashboard" && (
              <Dashboard
                proposals={active}
                statuses={statuses}
                settings={settings}
                isLoading={!isDataLoaded}
                aiEnabled={aiEnabled}
                recentSearches={recentSearches}
                onAddRecentSearch={proposals.addRecentSearch}
                onClearRecentSearches={proposals.clearRecentSearches}
                onCreate={handleCreateNew}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onArchiveMany={handleArchiveMany}
                onView={setDetailsModal}
                onHistory={setHistoryModal}
                onEmail={handleEmail}
                onAI={runAISummary}
              />
            )}

            {view === "archive" && (
              <ArchiveView
                proposals={archived}
                statuses={statuses}
                onRestore={(id) => {
                  proposals.restoreProposals([id]);
                  toast.success(t("shell.proposalRestored"));
                }}
                onPurge={(id) => {
                  proposals.purgeProposal(id);
                  toast.success(t("shell.proposalPurged"));
                }}
              />
            )}

            {view === "form" && (
              <FormProvider {...methods}>
                <form
                  id="proposal-form"
                  onSubmit={methods.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="md:hidden mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-1">
                      {t("shell.eyebrowForm")}
                    </p>
                    <h2 className="text-xl font-serif font-bold text-neutral-900 tracking-tight">
                      {t("shell.titleFormMobile")}
                    </h2>
                  </div>

                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
                    <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                      <FormSectionA />
                      <FormSectionC />
                    </div>
                    <div className="lg:col-span-7 space-y-6 lg:space-y-8 flex flex-col">
                      <FormSectionB />
                      <FormSectionD statuses={statuses} />
                    </div>
                  </div>

                  <div className="md:hidden flex flex-col sm:flex-row gap-4 pt-6 mt-8 border-t border-brand-500/10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="lg"
                      onClick={() => setView("dashboard")}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      className="shadow-lg shadow-brand-700/20"
                    >
                      {t("shell.saveEntry")}
                    </Button>
                  </div>
                </form>
              </FormProvider>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {historyModal && (
          <HistoryModal
            proposal={historyModal}
            onClose={() => setHistoryModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailsModal && (
          <DetailsModal
            proposal={detailsModal}
            statuses={statuses}
            aiEnabled={aiEnabled}
            onEdit={handleEdit}
            onAI={runAISummary}
            onClose={() => setDetailsModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            statuses={statuses}
            settings={settings}
            onSaveStatuses={proposals.persistStatuses}
            onResetStatuses={proposals.resetStatuses}
            onSaveSettings={proposals.updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ai.open && (
          <AIModal
            title={ai.title}
            loading={ai.loading}
            content={ai.content}
            error={ai.error}
            mailto={ai.mailto}
            onClose={() => setAI((s) => ({ ...s, open: false }))}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
