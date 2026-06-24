import { useFormContext } from "react-hook-form";
import { SiteFormData } from "../schema";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/Card";
import { Textarea } from "./ui/Textarea";
import { POC_ROLES, HANDOVER_INFO } from "../constants";
import { useTranslation } from "../i18n/context";

export function FormSectionC() {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<SiteFormData>();
  const pocType = watch("pocType");
  const handoverType = watch("handoverType");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forms.sectionC.title")}</CardTitle>
        <CardDescription>{t("forms.sectionC.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Person You Met */}
        <div className="space-y-4">
          <Field
            label={t("forms.poc")}
            htmlFor="pocType"
            error={errors.pocType?.message}
          >
            <Select
              id="pocType"
              {...register("pocType")}
              error={!!errors.pocType}
            >
              <option value="">{t("forms.poc.placeholder")}</option>
              {POC_ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`poc.${role}`)}
                </option>
              ))}
            </Select>
          </Field>

          {pocType === "Others" && (
            <div className="pl-4 border-l-2 border-brand-500/20 ml-2 animate-in slide-in-from-top-2">
              <Field
                label={t("forms.pocOther")}
                htmlFor="pocOther"
                error={errors.pocOther?.message}
              >
                <Input
                  id="pocOther"
                  placeholder={t("forms.pocOther.placeholder")}
                  {...register("pocOther")}
                  error={!!errors.pocOther}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Handover Information */}
        <div className="space-y-4">
          <Field
            label={t("forms.handover")}
            htmlFor="handoverType"
            error={errors.handoverType?.message}
          >
            <Select
              id="handoverType"
              {...register("handoverType")}
              error={!!errors.handoverType}
            >
              <option value="">{t("forms.handover.placeholder")}</option>
              {HANDOVER_INFO.map((info) => (
                <option key={info} value={info}>
                  {t(`handover.${info}`)}
                </option>
              ))}
            </Select>
          </Field>

          {handoverType === "Others" && (
            <div className="pl-4 border-l-2 border-brand-500/20 ml-2 animate-in slide-in-from-top-2">
              <Field
                label={t("forms.handoverOther")}
                htmlFor="handoverOther"
                error={errors.handoverOther?.message}
              >
                <Input
                  id="handoverOther"
                  placeholder={t("forms.handoverOther.placeholder")}
                  {...register("handoverOther")}
                  error={!!errors.handoverOther}
                />
              </Field>
            </div>
          )}
        </div>

        {/* Tenure */}
        <div className="space-y-4">
          <Field
            label={t("forms.tenure")}
            htmlFor="tenureValue"
            error={errors.tenureValue?.message || errors.tenureUnit?.message}
          >
            <div className="flex rounded-md shadow-sm">
              <Input
                id="tenureValue"
                type="number"
                min="1"
                placeholder="1"
                {...register("tenureValue", { valueAsNumber: true })}
                error={!!errors.tenureValue}
                className="font-mono text-center rounded-r-none z-10"
              />
              <Select
                id="tenureUnit"
                {...register("tenureUnit")}
                error={!!errors.tenureUnit}
                className="rounded-l-none -ml-px w-1/2 bg-neutral-50"
              >
                <option value="Months">{t("forms.months")}</option>
                <option value="Years">{t("forms.years")}</option>
              </Select>
            </div>
          </Field>
        </div>

        {/* Handover Moment */}
        <div className="space-y-4 bg-brand-50/30 p-4 rounded-xl border border-brand-500/10 mt-6">
          <h4 className="font-serif font-bold text-brand-800 border-b border-brand-500/10 pb-2 mb-4">
            {t("forms.handoverSchedule")}
          </h4>
          <Field
            label={t("forms.targetDateTime")}
            htmlFor="handoverMoment"
            error={errors.handoverMoment?.message}
          >
            <Input
              id="handoverMoment"
              type="datetime-local"
              {...register("handoverMoment")}
              error={!!errors.handoverMoment}
              className="bg-white"
            />
          </Field>

          <Field
            label={t("forms.contextualNotes")}
            htmlFor="handoverNotes"
            error={errors.handoverNotes?.message}
            description={t("forms.contextualNotes.desc")}
          >
            <Textarea
              id="handoverNotes"
              placeholder={t("forms.contextualNotes.placeholder")}
              {...register("handoverNotes")}
              error={!!errors.handoverNotes}
              className="bg-white"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
