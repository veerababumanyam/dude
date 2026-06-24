import { useFormContext, Controller } from "react-hook-form";
import { SiteFormData } from "../schema";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { UNIT_TYPES } from "../constants";
import { MapPin, Search, X } from "lucide-react";
import { Button } from "./ui/Button";
import { useState } from "react";

export function FormSectionA() {
  const { register, watch, formState: { errors }, setValue } = useFormContext<SiteFormData>();
  const unitType = watch("unitType");
  const siteName = watch("siteName") || "";
  const [showMapModal, setShowMapModal] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. General Site Details</CardTitle>
        <CardDescription>Enter the basic information about the site location.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Serial No */}
        <Field label="Serial No." htmlFor="serialNo" error={errors.serialNo?.message} description="Optional unique identifier">
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
              placeholder="Search or enter ID..." 
              {...register("serialNo")} 
              error={!!errors.serialNo}
              className="pl-10 font-mono"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
          </div>
        </Field>

        {/* Site Name */}
        <Field label="Site Name" htmlFor="siteName" error={errors.siteName?.message}>
          <div className="relative">
            <Input 
              id="siteName" 
              placeholder="Enter site name" 
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
        <Field label="Location" htmlFor="location" error={errors.location?.message}>
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
                  placeholder="Search area name..." 
                  {...register("location")} 
                  error={!!errors.location}
                />
             </div>
             <Button type="button" variant="outline" size="icon" aria-label="Open Map" onClick={() => setShowMapModal(true)}>
               <MapPin className="h-5 w-5 text-brand-700" />
             </Button>
           </div>
        </Field>

        {showMapModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="font-serif font-bold text-lg text-neutral-900">Pin Location</h3>
                 <button type="button" onClick={() => setShowMapModal(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors p-1 rounded-md hover:bg-neutral-200">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="h-72 bg-blue-50/50 relative flex items-center justify-center overflow-hidden border-y border-neutral-100">
                 {/* Map Placeholder */}
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                 <div className="text-center z-10 space-y-3">
                   <div className="relative mx-auto w-12 h-12">
                     <MapPin className="absolute inset-0 w-full h-full text-brand-700 drop-shadow-xl animate-bounce" />
                     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-brand-900/20 rounded-full blur-[2px]"></div>
                   </div>
                   <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm text-sm font-medium text-brand-800 border border-brand-500/10">
                     Interactive Map Service
                   </div>
                 </div>
              </div>
              <div className="p-4 bg-white flex justify-end gap-3">
                 <Button type="button" variant="ghost" onClick={() => setShowMapModal(false)}>Cancel</Button>
                 <Button type="button" onClick={() => {
                   setValue("location", "Selected via Map Pin", { shouldValidate: true });
                   setShowMapModal(false);
                 }} className="shadow-md shadow-brand-700/20">
                   Confirm Location
                 </Button>
              </div>
            </div>
          </div>
        )}

        {/* Units */}
        <div className="space-y-4">
           <Field label="Unit Type" htmlFor="unitType" error={errors.unitType?.message}>
             <Select id="unitType" {...register("unitType")} error={!!errors.unitType}>
               <option value="">Select unit type...</option>
               {UNIT_TYPES.map(unit => (
                 <option key={unit} value={unit}>{unit}</option>
               ))}
             </Select>
           </Field>
           
           {unitType === "Other" && (
             <Field label="Specify Other Unit Type" htmlFor="unitOther" error={errors.unitOther?.message}>
               <Input 
                 id="unitOther" 
                 placeholder="Enter custom unit type" 
                 {...register("unitOther")} 
                 error={!!errors.unitOther}
               />
             </Field>
           )}
        </div>

        {/* Square Footage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Overall Area (Sq.ft)" htmlFor="overallSqft" error={errors.overallSqft?.message}>
            <Input 
              id="overallSqft" 
              type="number" 
              min="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
              }}
              placeholder="0" 
              {...register("overallSqft", { valueAsNumber: true })} 
              error={!!errors.overallSqft}
              className="font-mono"
            />
          </Field>
          <Field label="Clubhouse Area (Sq.ft)" htmlFor="clubhouseSqft" error={errors.clubhouseSqft?.message}>
             <Input 
              id="clubhouseSqft" 
              type="number" 
              min="0"
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e') e.preventDefault();
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
