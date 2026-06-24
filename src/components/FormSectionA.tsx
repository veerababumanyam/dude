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
import { UNIT_TYPES } from "../constants";
import { MapPin, Search } from "lucide-react";
import { Button } from "./ui/Button";
import { useState } from "react";
import { LocationPickerModal } from "./LocationPickerModal";
import { useTranslation } from "../i18n/context";

export function FormSectionA() {
  const { t } = useTranslation();
  const {
    register,
    watch,
    formState: { errors },
    setValue,
  } = useFormContext<SiteFormData>();
  const unitType = watch("unitType");
  const siteName = watch("siteName") || "";
  const [showMapModal, setShowMapModal] = useState(false);
  const currentLat = watch("lat" as any) as number | undefined;
  const currentLng = watch("lng" as any) as number | undefined;
  const currentLocation = watch("location") || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forms.sectionA.title")}</CardTitle>
        <CardDescription>{t("forms.sectionA.desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Serial No */}
        <Field
          label={t("forms.serialNo")}
          htmlFor="serialNo"
          error={errors.serialNo?.message}
          description={t("forms.serialNo.desc")}
        >
          <div className="relative">
            <datalist id="serial-numbers">
              <option value="KRY-1001" />
              <option value="KRY-1002" />
              <option value="KRY-1003" />
              <option value="KRY-1004" />
              <option value="KRY-1005" />
            </datalist>
            <Input
              id="serialNo"
              list="serial-numbers"
              placeholder={t("forms.serialNo.placeholder")}
              {...register("serialNo")}
              error={!!errors.serialNo}
              className="pl-10 font-mono"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          </div>
        </Field>

        {/* Site Name */}
        <Field
          label={t("forms.siteName")}
          htmlFor="siteName"
          error={errors.siteName?.message}
        >
          <div className="relative">
            <Input
              id="siteName"
              placeholder={t("forms.siteName.placeholder")}
              {...register("siteName")}
              error={!!errors.siteName}
              maxLength={100}
              className="pr-16"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-400 pointer-events-none">
              {siteName.length}/100
            </div>
          </div>
        </Field>

        {/* Location */}
        <Field
          label={t("forms.location")}
          htmlFor="location"
          error={errors.location?.message}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <datalist id="locations">
                <option value="Mumbai" />
                <option value="Delhi NCR" />
                <option value="Bangalore" />
                <option value="Hyderabad" />
                <option value="Chennai" />
                <option value="Pune" />
                <option value="Kolkata" />
                <option value="Ahmedabad" />
              </datalist>
              <Input
                id="location"
                list="locations"
                placeholder={t("forms.location.placeholder")}
                {...register("location")}
                error={!!errors.location}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("forms.openMap")}
              onClick={() => setShowMapModal(true)}
            >
              <MapPin className="h-5 w-5 text-brand-700" />
            </Button>
          </div>
        </Field>

        {showMapModal && (
          <LocationPickerModal
            initial={{
              lat: currentLat,
              lng: currentLng,
              label: currentLocation,
            }}
            onClose={() => setShowMapModal(false)}
            onConfirm={({ label, lat, lng }) => {
              setValue("location", label, { shouldValidate: true });
              setValue("lat" as any, lat);
              setValue("lng" as any, lng);
              setShowMapModal(false);
            }}
          />
        )}

        {/* Units */}
        <div className="space-y-4">
          <Field
            label={t("forms.unitType")}
            htmlFor="unitType"
            error={errors.unitType?.message}
          >
            <Select
              id="unitType"
              {...register("unitType")}
              error={!!errors.unitType}
            >
              <option value="">{t("forms.unitType.placeholder")}</option>
              {UNIT_TYPES.map((unit) => (
                <option key={unit} value={unit}>
                  {t(`unit.${unit}`)}
                </option>
              ))}
            </Select>
          </Field>

          {unitType === "Other" && (
            <Field
              label={t("forms.unitOther")}
              htmlFor="unitOther"
              error={errors.unitOther?.message}
            >
              <Input
                id="unitOther"
                placeholder={t("forms.unitOther.placeholder")}
                {...register("unitOther")}
                error={!!errors.unitOther}
              />
            </Field>
          )}
        </div>

        {/* Square Footage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label={t("forms.overallSqft")}
            htmlFor="overallSqft"
            error={errors.overallSqft?.message}
          >
            <Input
              id="overallSqft"
              type="number"
              min="0"
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              placeholder="0"
              {...register("overallSqft", { valueAsNumber: true })}
              error={!!errors.overallSqft}
              className="font-mono"
            />
          </Field>
          <Field
            label={t("forms.clubhouseSqft")}
            htmlFor="clubhouseSqft"
            error={errors.clubhouseSqft?.message}
          >
            <Input
              id="clubhouseSqft"
              type="number"
              min="0"
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              placeholder="0"
              {...register("clubhouseSqft", { valueAsNumber: true })}
              error={!!errors.clubhouseSqft}
              className="font-mono"
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}
