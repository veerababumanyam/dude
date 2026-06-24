import * as React from "react"
import { cn } from "../../utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border bg-white px-4 py-3 text-sm text-neutral-900 transition-colors placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50 outline-none",
          error ? "border-status-error focus-visible:ring-status-error" : "border-brand-500/20",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
