import { useFormContext, Controller } from "react-hook-form";
import { SiteFormData } from "../schema";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Checkbox } from "./ui/Checkbox";
import { ROLE_LABELS, STATUS_OPTIONS, TIMING_OPTIONS } from "../constants";
import { useMemo } from "react";
import { Textarea } from "./ui/Textarea";
import CurrencyInput from 'react-currency-input-field';

export function FormSectionD({ statuses = STATUS_OPTIONS }: { statuses?: typeof STATUS_OPTIONS }) {
  const { register, watch, control, setValue, formState: { errors } } = useFormContext<SiteFormData>();
  
  // Watch entire form to extract roles with quantities > 0
  const formData = watch();

  const activeRoles = useMemo(() => {
    const roles: { key: string; label: string; qty: number }[] = [];

    const addRole = (key: string, qty?: number) => {
      if (qty && qty > 0) {
        roles.push({ key, label: ROLE_LABELS[key] || key, qty });
      }
    };

    if (formData.services?.includes("housekeeping") && formData.housekeeping) {
      addRole("hkExecutive", formData.housekeeping.hkExecutive);
      addRole("hkSupervisor", formData.housekeeping.hkSupervisor);
      addRole("hkStaff", formData.housekeeping.hkStaff);
    }

    if (formData.services?.includes("security") && formData.security) {
      addRole("so", formData.security.so?.qty);
      addRole("aso", formData.security.aso?.qty);
      addRole("supervisor", formData.security.supervisor?.qty);
      addRole("guards", formData.security.guards?.qty);
    }

    if (formData.services?.includes("mep") && formData.mep) {
      Object.entries(formData.mep).forEach(([key, val]) => addRole(key, val as number));
    }

    if (formData.services?.includes("horticulture") && formData.horticulture) {
       addRole("gardenerSupervisor", formData.horticulture.gardenerSupervisor?.qty);
       addRole("gardeners", formData.horticulture.gardeners?.qty);
    }

    if (formData.services?.includes("coaches") && formData.coaches) {
      addRole("gym", formData.coaches.gym);
      addRole("pool", formData.coaches.pool);
      addRole("yoga", formData.coaches.yoga);
      addRole("badminton", formData.coaches.badminton);
    }

    return roles;
  }, [formData]);

  const estimatedCost = useMemo(() => {
    let total = 0;
    activeRoles.forEach(role => {
      const salary = formData.salaries?.[role.key] || 0;
      total += role.qty * salary;
    });
    return total;
  }, [activeRoles, formData.salaries]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Commercials & Status</CardTitle>
        <CardDescription>Configure financial details and current pipeline status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Required Manpower & Salaries */}
        <div className="space-y-4">
          <h4 className="text-lg font-serif font-semibold text-brand-700">Required Manpower & Salaries</h4>
          
          {activeRoles.length === 0 ? (
            <div className="p-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-center text-sm text-neutral-500">
              Select services and enter quantities in Section 2 to assign salaries.
            </div>
          ) : (
            <div className="space-y-3">
              {activeRoles.map((role) => (
                <div key={role.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg shadow-sm">
                   <div className="flex-1">
                     <div className="font-medium text-neutral-900">{role.label}</div>
                     <div className="text-sm text-neutral-500 font-mono text-brand-700">Qty: {role.qty}</div>
                   </div>
                   <div className="relative w-full sm:w-48">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-mono pointer-events-none">₹</span>
                     <Controller
                       control={control}
                       name={`salaries.${role.key}` as any}
                       render={({ field: { onChange, value, name } }) => (
                          <CurrencyInput
                            id={`salary-${role.key}`}
                            name={name}
                            value={value}
                            decimalsLimit={2}
                            placeholder="Salary"
                            onValueChange={(val) => {
                              onChange(val ? Number(val) : undefined);
                            }}
                            className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 pl-8 font-mono"
                          />
                       )}
                     />
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ESI & PF */}
        <div className="space-y-3">
           <Field label="ESI & PF Required?" error={errors.esiPf?.message}>
              <div className="flex gap-4 mt-2">
                 <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-md flex-1 justify-center hover:bg-neutral-50 has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50">
                    <input type="radio" value="Yes" {...register("esiPf")} className="accent-brand-700 w-4 h-4" />
                    <span className="font-medium text-neutral-900">Yes</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-md flex-1 justify-center hover:bg-neutral-50 has-[:checked]:border-brand-700 has-[:checked]:bg-brand-50">
                    <input type="radio" value="No" {...register("esiPf")} className="accent-brand-700 w-4 h-4" />
                    <span className="font-medium text-neutral-900">No</span>
                 </label>
              </div>
           </Field>
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Priority" htmlFor="priority" error={errors.priority?.message}>
            <Select 
              id="priority" 
              {...register("priority")} 
              error={!!errors.priority}
            >
              <option value="">Select priority...</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </Field>

          <Field label="Quotation Status" htmlFor="status" error={errors.status?.message}>
            <div className="relative">
              <Select 
                id="status" 
                {...register("status")} 
                error={!!errors.status}
                className={formData.status ? statuses.find(s => s.value === formData.status)?.bg : ""}
              >
                <option value="">Select status...</option>
                {statuses.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value}</option>
                ))}
              </Select>
              {/* Visual Indicator dot if selected */}
              {formData.status && (
                 <div 
                   className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                   style={{ backgroundColor: statuses.find(s => s.value === formData.status)?.color }}
                 />
              )}
              <style>{`
                #status { padding-left: ${formData.status ? '2.5rem' : '1rem'}; font-weight: ${formData.status ? '600' : 'normal'}; }
              `}</style>
            </div>
          </Field>
        </div>

        {/* Timings */}
        <div className="space-y-3">
          <Field label="Timings" error={errors.timings?.message}>
            <div className="flex flex-col gap-2 mt-2">
              {TIMING_OPTIONS.map((timing) => (
                 <label key={timing} className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-brand-700">
                   <Controller
                     control={control}
                     name="timings"
                     render={({ field }) => (
                       <Checkbox
                         checked={field.value?.includes(timing)}
                         onChange={(e) => {
                           const value = field.value || [];
                           if (e.target.checked) {
                             field.onChange([...value, timing]);
                           } else {
                             field.onChange(value.filter((val) => val !== timing));
                           }
                         }}
                       />
                     )}
                   />
                   <span className="font-medium text-neutral-900">{timing}</span>
                 </label>
              ))}
            </div>
          </Field>
          
          <Field label="Timing Notes" htmlFor="timingNotes" description="Custom timing notes if required">
             <Textarea 
               id="timingNotes" 
               placeholder="Enter custom timings..." 
               {...register("timingNotes")} 
             />
          </Field>
        </div>

        {/* Quotation Value */}
        <div className="pt-6 border-t border-brand-500/10">
          <div className="flex items-center justify-between mb-4">
             <div>
               <h4 className="text-lg font-serif font-semibold text-brand-700">Final Quotation Value</h4>
               <p className="text-sm text-neutral-500">Override the calculated estimate if necessary.</p>
             </div>
             {estimatedCost > 0 && (
               <div className="text-right">
                 <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">Auto-Estimate</div>
                 <div className="text-lg font-mono font-bold text-neutral-900">₹{estimatedCost.toLocaleString()}</div>
               </div>
             )}
          </div>
          <Field label="Total Quotation Value" htmlFor="quotationValue" error={errors.quotationValue?.message}>
            <div className="relative flex items-center">
              <span className="absolute left-4 font-mono font-bold text-brand-700 text-lg pointer-events-none">₹</span>
              <Controller
                control={control}
                name="quotationValue"
                render={({ field: { onChange, value, name, ref } }) => (
                   <CurrencyInput
                     id="quotationValue"
                     name={name}
                     value={value}
                     decimalsLimit={2}
                     placeholder="0"
                     onValueChange={(val) => {
                       onChange(val ? Number(val) : undefined);
                     }}
                     className={`flex w-full rounded-md border ${errors.quotationValue ? 'border-status-error focus-visible:ring-status-error' : 'border-neutral-300 focus-visible:ring-brand-500'} bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-4 py-4 text-2xl font-mono font-bold text-brand-700 bg-brand-50 border-brand-700/30 h-auto`}
                   />
                )}
              />
            </div>
            {estimatedCost > 0 && formData.quotationValue !== estimatedCost && (
              <button 
                type="button"
                onClick={() => setValue("quotationValue", estimatedCost, { shouldValidate: true })}
                className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1.5"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                Use Calculated Estimate (₹{estimatedCost.toLocaleString()})
              </button>
            )}
          </Field>
        </div>

      </CardContent>
    </Card>
  );
}
