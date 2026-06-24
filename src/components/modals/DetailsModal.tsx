import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  MapPin,
  UserCircle,
  Briefcase,
  Edit2,
  Download,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Proposal, StatusOption } from "../../types";
import { formatCurrency } from "../../utils";
import { getStatusBg } from "../../lib/proposals";
import { downloadProposalPdf } from "../../lib/pdf";
import { useTranslation } from "../../i18n/context";

interface DetailsModalProps {
  proposal: Proposal;
  statuses: StatusOption[];
  aiEnabled: boolean;
  onEdit: (p: Proposal) => void;
  onAI: (p: Proposal) => void;
  onClose: () => void;
}

export function DetailsModal({
  proposal,
  statuses,
  aiEnabled,
  onEdit,
  onAI,
  onClose,
}: DetailsModalProps) {
  const { t } = useTranslation();
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPDF = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      await downloadProposalPdf(proposal, statuses);
    } catch (e) {
      console.error("PDF export failed", e);
      toast.error(t("modals.pdfError"));
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Modal
      onClose={onClose}
      className="max-w-4xl max-h-[90vh] flex flex-col"
      labelledBy="details-title"
    >
      <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-mono font-bold text-neutral-500">
              {proposal.id}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusBg(
                statuses,
                proposal.status,
              )}`}
            >
              {t(`status.${proposal.status}`)}
            </span>
          </div>
          <h3
            id="details-title"
            className="font-serif font-bold text-2xl text-neutral-900"
          >
            {proposal.siteName}
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label={t("common.close")}
          className="text-neutral-400 hover:text-neutral-900 transition-colors p-2 rounded-full hover:bg-neutral-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-neutral-50 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {t("modals.generalDetails")}
              </h4>
              <div className="space-y-3">
                <Detail label={t("modals.location")} value={proposal.location} />
                <Detail
                  label={t("modals.propertyType")}
                  value={t(`unit.${proposal.unitType}`)}
                />
                <Detail
                  label={t("modals.totalArea")}
                  value={t("modals.sqftValue", {
                    value: proposal.overallSqft?.toLocaleString() || 0,
                  })}
                />
                {(proposal.clubhouseSqft ?? 0) > 0 && (
                  <Detail
                    label={t("modals.clubhouseArea")}
                    value={t("modals.sqftValue", {
                      value: proposal.clubhouseSqft!.toLocaleString(),
                    })}
                  />
                )}
                {proposal.priority && (
                  <div>
                    <span className="text-neutral-500 text-sm">
                      {t("modals.priority")}:
                    </span>{" "}
                    <span
                      className={`font-medium ${
                        proposal.priority === "High"
                          ? "text-red-600"
                          : proposal.priority === "Medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {t(`modals.priority.${proposal.priority}`)}
                    </span>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserCircle className="w-4 h-4" /> {t("modals.contactHandover")}
              </h4>
              <div className="space-y-3">
                <Detail
                  label={t("modals.poc")}
                  value={t(`poc.${proposal.pocType}`)}
                />
                <Detail
                  label={t("modals.handoverBy")}
                  value={`${t(`handover.${proposal.handoverType}`)}${
                    proposal.handoverOther ? ` (${proposal.handoverOther})` : ""
                  }`}
                />
                <Detail
                  label={t("modals.tenure")}
                  value={`${proposal.tenureValue} ${t(
                    `modals.tenureUnit.${proposal.tenureUnit}`,
                  )}`}
                />
                <Detail
                  label={t("modals.targetDate")}
                  value={
                    proposal.handoverMoment
                      ? format(
                          new Date(proposal.handoverMoment),
                          "MMM d, yyyy h:mm a",
                        )
                      : t("modals.notAvailable")
                  }
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm">
              <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> {t("modals.servicesSetup")}
              </h4>
              <div className="flex flex-wrap gap-2 mb-4">
                {proposal.services?.length ? (
                  proposal.services.map((svc) => (
                    <span
                      key={svc}
                      className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-md text-xs font-bold uppercase tracking-wide border border-brand-200"
                    >
                      {t(`service.${svc}`)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-neutral-500">
                    {t("modals.noServicesSelected")}
                  </span>
                )}
              </div>
              {proposal.timings?.length ? (
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <span className="text-neutral-500 text-sm block mb-2">
                    {t("modals.timings")}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {proposal.timings.map((timing) => (
                      <span
                        key={timing}
                        className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium"
                      >
                        {t(`timing.${timing}`)}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {proposal.timingNotes && (
                <div className="mt-3 p-3 bg-neutral-50 rounded-md text-sm text-neutral-600 italic">
                  "{proposal.timingNotes}"
                </div>
              )}
            </section>

            <section className="bg-brand-50 p-5 rounded-xl border border-brand-200 shadow-sm">
              <h4 className="text-xs font-bold text-brand-700 uppercase tracking-widest mb-4">
                {t("modals.commercialOverview")}
              </h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-brand-200/50">
                  <span className="text-neutral-600">
                    {t("modals.esiPfIncluded")}
                  </span>
                  <span className="font-bold">
                    {proposal.esiPf
                      ? t(`modals.yesNo.${proposal.esiPf}`)
                      : t("modals.yesNo.No")}
                  </span>
                </div>
                <div className="flex justify-between items-end pt-2">
                  <span className="text-brand-700 font-serif font-bold text-lg">
                    {t("modals.finalQuotation")}
                  </span>
                  <span className="text-3xl font-mono font-bold text-brand-700">
                    {formatCurrency(proposal.quotationValue || 0)}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-100 flex justify-between bg-white shrink-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onEdit(proposal);
            }}
          >
            <Edit2 className="w-4 h-4 mr-2" /> {t("common.edit")}
          </Button>
          <Button
            variant="outline"
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="bg-white border-brand-200 text-brand-700 hover:bg-brand-50"
          >
            {pdfLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                {t("modals.pdfGenerating")}
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> {t("modals.pdf")}
              </>
            )}
          </Button>
          {aiEnabled && (
            <Button
              variant="outline"
              onClick={() => onAI(proposal)}
              className="bg-white border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <Sparkles className="w-4 h-4 mr-2" /> {t("modals.aiSummary")}
            </Button>
          )}
        </div>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </div>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500 text-sm">{label}:</span>{" "}
      <span className="font-medium">{value}</span>
    </div>
  );
}
