import { useFormContext, Controller } from "react-hook-form";
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
import { Checkbox } from "./ui/Checkbox";
import { SERVICES } from "../constants";
import { Label } from "./ui/Input";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "../i18n/context";

export function FormSectionB() {
  const { t } = useTranslation();
  const { register, watch, control } = useFormContext<SiteFormData>();
  const selectedServices = watch("services") || [];

  const hasService = (id: string) => selectedServices.includes(id);

  const RoleInput = ({
    servicePath,
    roleKey,
    labelOverride,
  }: {
    servicePath: string;
    roleKey: string;
    labelOverride?: string;
  }) => (
    <div className="flex items-center gap-3">
      <Label
        htmlFor={`${servicePath}.${roleKey}`}
        className="flex-1 text-sm font-normal text-neutral-700"
      >
        {labelOverride || t(`role.${roleKey}`)}
      </Label>
      <Input
        id={`${servicePath}.${roleKey}`}
        type="number"
        min="0"
        placeholder={t("common.qty")}
        {...register(`${servicePath}.${roleKey}` as any, {
          valueAsNumber: true,
        })}
        className="w-24 text-center font-mono"
      />
    </div>
  );

  const RoleWithModifiers = ({
    servicePath,
    roleKey,
  }: {
    servicePath: string;
    roleKey: string;
  }) => (
    <div className="space-y-3 p-4 bg-brand-50/50 rounded-xl border border-brand-500/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Label className="flex-1 font-bold text-neutral-900 normal-case tracking-normal">
          {t(`role.${roleKey}`)}
        </Label>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            type="number"
            min="0"
            placeholder={t("common.qty")}
            {...register(`${servicePath}.${roleKey}.qty` as any, {
              valueAsNumber: true,
            })}
            className="w-full sm:w-24 text-center font-mono"
            aria-label={t("forms.qtyAriaLabel", { role: t(`role.${roleKey}`) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          {...register(`${servicePath}.${roleKey}.gender` as any)}
          aria-label={t("forms.genderAriaLabel", {
            role: t(`role.${roleKey}`),
          })}
        >
          <option value="">{t("opt.anyGender")}</option>
          <option value="Male">{t("opt.male")}</option>
          <option value="Female">{t("opt.female")}</option>
        </Select>
        <Select
          {...register(`${servicePath}.${roleKey}.shift` as any)}
          aria-label={t("forms.shiftAriaLabel", { role: t(`role.${roleKey}`) })}
        >
          <option value="">{t("opt.anyShift")}</option>
          <option value="Day">{t("opt.day")}</option>
          <option value="Night">{t("opt.night")}</option>
        </Select>
      </div>
    </div>
  );

  const motionProps = {
    initial: { opacity: 0, y: -10, height: 0 },
    animate: { opacity: 1, y: 0, height: "auto" },
    exit: { opacity: 0, y: -10, height: 0 },
    transition: { duration: 0.2 },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forms.sectionB.title")}</CardTitle>
        <CardDescription>{t("forms.sectionB.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field
          label={t("forms.requiredServices")}
          description={t("common.selectAll")}
        >
          <div className="flex flex-col gap-2 mt-2">
            {SERVICES.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-brand-700"
              >
                <Controller
                  control={control}
                  name="services"
                  render={({ field }) => {
                    return (
                      <Checkbox
                        checked={field.value?.includes(service.id)}
                        onChange={(e) => {
                          const value = field.value || [];
                          if (e.target.checked) {
                            field.onChange([...value, service.id]);
                          } else {
                            field.onChange(
                              value.filter((val) => val !== service.id),
                            );
                          }
                        }}
                      />
                    );
                  }}
                />
                <span className="font-medium text-neutral-900">
                  {t(`service.${service.id}`)}
                </span>
              </label>
            ))}
          </div>
        </Field>

        <div aria-live="polite" className="space-y-6 mt-6">
          <AnimatePresence initial={false}>
            {hasService("housekeeping") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.housekeepingOptions")}
                </h4>
                <div className="space-y-3">
                  <RoleInput servicePath="housekeeping" roleKey="hkExecutive" />
                  <RoleInput
                    servicePath="housekeeping"
                    roleKey="hkSupervisor"
                  />
                  <RoleInput servicePath="housekeeping" roleKey="hkStaff" />
                </div>
              </motion.div>
            )}

            {hasService("security") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.securityOptions")}
                </h4>
                <div className="space-y-4">
                  <RoleWithModifiers servicePath="security" roleKey="so" />
                  <RoleWithModifiers servicePath="security" roleKey="aso" />
                  <RoleWithModifiers
                    servicePath="security"
                    roleKey="supervisor"
                  />
                  <RoleWithModifiers servicePath="security" roleKey="guards" />
                </div>
              </motion.div>
            )}

            {hasService("mep") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.mepOptions")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <RoleInput servicePath="mep" roleKey="fm" />
                  <RoleInput servicePath="mep" roleKey="afm" />
                  <RoleInput servicePath="mep" roleKey="executive" />
                  <RoleInput servicePath="mep" roleKey="helpdesk" />
                  <RoleInput servicePath="mep" roleKey="techSupervisor" />
                  <RoleInput servicePath="mep" roleKey="electricians" />
                  <RoleInput servicePath="mep" roleKey="plumbers" />
                  <RoleInput servicePath="mep" roleKey="mst" />
                  <RoleInput servicePath="mep" roleKey="mason" />
                  <RoleInput servicePath="mep" roleKey="carpenter" />
                  <RoleInput servicePath="mep" roleKey="painter" />
                  <RoleInput servicePath="mep" roleKey="stpOperator" />
                  <RoleInput servicePath="mep" roleKey="wtpOperator" />
                  <RoleInput servicePath="mep" roleKey="poolOperator" />
                  <RoleInput servicePath="mep" roleKey="cctvOperator" />
                  <RoleInput servicePath="mep" roleKey="fireSafetyOperator" />
                  <RoleInput servicePath="mep" roleKey="accountant" />
                </div>
              </motion.div>
            )}

            {hasService("horticulture") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.horticultureOptions")}
                </h4>
                <div className="space-y-4">
                  <div className="space-y-3 p-4 bg-brand-50/50 rounded-lg border border-brand-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Label className="flex-1 font-medium text-brand-800">
                        {t("role.gardenerSupervisor")}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("common.qty")}
                        {...register(
                          `horticulture.gardenerSupervisor.qty` as any,
                          { valueAsNumber: true },
                        )}
                        className="w-full sm:w-24 text-center font-mono"
                      />
                    </div>
                    <Select
                      {...register(
                        `horticulture.gardenerSupervisor.gender` as any,
                      )}
                    >
                      <option value="">{t("opt.anyGender")}</option>
                      <option value="Male">{t("opt.male")}</option>
                      <option value="Female">{t("opt.female")}</option>
                    </Select>
                  </div>
                  <div className="space-y-3 p-4 bg-brand-50/50 rounded-lg border border-brand-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Label className="flex-1 font-medium text-brand-800">
                        {t("role.gardeners")}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder={t("common.qty")}
                        {...register(`horticulture.gardeners.qty` as any, {
                          valueAsNumber: true,
                        })}
                        className="w-full sm:w-24 text-center font-mono"
                      />
                    </div>
                    <Select
                      {...register(`horticulture.gardeners.gender` as any)}
                    >
                      <option value="">{t("opt.anyGender")}</option>
                      <option value="Male">{t("opt.male")}</option>
                      <option value="Female">{t("opt.female")}</option>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {hasService("coaches") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.coachesOptions")}
                </h4>
                <div className="space-y-3">
                  <RoleInput servicePath="coaches" roleKey="gym" />
                  <RoleInput servicePath="coaches" roleKey="pool" />
                  <RoleInput servicePath="coaches" roleKey="yoga" />
                  <RoleInput servicePath="coaches" roleKey="badminton" />
                </div>
              </motion.div>
            )}

            {hasService("pestControl") && (
              <motion.div
                {...motionProps}
                className="space-y-4 overflow-hidden mt-4"
              >
                <h4 className="text-lg font-serif font-semibold text-brand-700 border-b pb-2">
                  {t("forms.pestControlServices")}
                </h4>
                <div className="p-4 bg-brand-50/50 rounded-lg border border-brand-500/20">
                  <Controller
                    control={control}
                    name="pestControl"
                    render={({ field }) => (
                      <label className="flex items-center gap-4 cursor-pointer">
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                        />
                        <div>
                          <div className="font-medium text-brand-800">
                            {t("forms.includePestControl")}
                          </div>
                          <div className="text-sm text-neutral-600">
                            {t("forms.pestControlDesc")}
                          </div>
                        </div>
                      </label>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
