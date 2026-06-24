import * as React from "react"
import { cn } from "../../utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-[44px] w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-neutral-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50 outline-none",
          error ? "border-status-error focus-visible:ring-status-error" : "border-brand-500/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-bold text-neutral-600 mb-1.5 uppercase tracking-wider peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

const ErrorMessage = ({ children }: { children?: React.ReactNode }) => {
  if (!children) return null;
  return <p className="text-xs font-bold text-status-error mt-1.5">{children}</p>;
}

export { Input, Label, ErrorMessage }
