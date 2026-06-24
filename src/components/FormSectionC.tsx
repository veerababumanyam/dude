import { useFormContext } from "react-hook-form";
import { SiteFormData } from "../schema";
import { Field } from "./ui/Field";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Textarea } from "./ui/Textarea";
import { POC_ROLES, HANDOVER_INFO } from "../constants";

export function FormSectionC() {
  const { register, watch, formState: { errors } } = useFormContext<SiteFormData>();
  const pocType = watch("pocType");
  const handoverType = watch("handoverType");

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Handover & Contact Information</CardTitle>
        <CardDescription>Details about the primary contact and timeline.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Person You Met */}
        <div className="space-y-4">
           <Field label="Person You Met (POC)" htmlFor="pocType" error={errors.pocType?.message}>
             <Select id="pocType" {...register("pocType")} error={!!errors.pocType}>
               <option value="">Select role...</option>
               {POC_ROLES.map(role => (
                 <option key={role} value={role}>{role}</option>
               ))}
             </Select>
           </Field>
           
           {pocType === "Others" && (
             <div className="pl-4 border-l-2 border-brand-500/20 ml-2 animate-in slide-in-from-top-2">
               <Field label="Specify Point of Contact" htmlFor="pocOther" error={errors.pocOther?.message}>
                 <Input 
                   id="pocOther" 
                   placeholder="Enter contact role or name" 
                   {...register("pocOther")} 
                   error={!!errors.pocOther}
                 />
               </Field>
             </div>
           )}
        </div>

        {/* Handover Information */}
        <div className="space-y-4">
           <Field label="Handover Information" htmlFor="handoverType" error={errors.handoverType?.message}>
             <Select id="handoverType" {...register("handoverType")} error={!!errors.handoverType}>
               <option value="">Select handover type...</option>
               {HANDOVER_INFO.map(info => (
                 <option key={info} value={info}>{info}</option>
               ))}
             </Select>
           </Field>
           
           {handoverType === "Others" && (
             <div className="pl-4 border-l-2 border-brand-500/20 ml-2 animate-in slide-in-from-top-2">
               <Field label="Specify Handover Information" htmlFor="handoverOther" error={errors.handoverOther?.message}>
                 <Input 
                   id="handoverOther" 
                   placeholder="Enter handover details" 
                   {...register("handoverOther")} 
                   error={!!errors.handoverOther}
                 />
               </Field>
             </div>
           )}
        </div>

        {/* Tenure */}
        <div className="space-y-4">
           <Field label="Tenure" htmlFor="tenureValue" error={errors.tenureValue?.message || errors.tenureUnit?.message}>
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
                 <option value="Months">Months</option>
                 <option value="Years">Years</option>
               </Select>
             </div>
           </Field>
        </div>

        {/* Handover Moment */}
        <div className="space-y-4 bg-brand-50/30 p-4 rounded-xl border border-brand-500/10 mt-6">
           <h4 className="font-serif font-bold text-brand-800 border-b border-brand-500/10 pb-2 mb-4">Handover Schedule</h4>
           <Field label="Target Date & Time" htmlFor="handoverMoment" error={errors.handoverMoment?.message}>
             <Input 
               id="handoverMoment" 
               type="datetime-local" 
               {...register("handoverMoment")} 
               error={!!errors.handoverMoment}
               className="bg-white"
             />
           </Field>
           
           <Field label="Contextual Notes" htmlFor="handoverNotes" error={errors.handoverNotes?.message} description="Optional contextual notes regarding the handover">
             <Textarea 
               id="handoverNotes" 
               placeholder="Enter any additional scheduling details or conditions..." 
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
