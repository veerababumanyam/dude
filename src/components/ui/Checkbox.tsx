import * as React from "react"
import { cn } from "../../utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative flex items-center justify-center h-11 w-11 -ml-3">
        <input
          type="checkbox"
          className={cn(
            "peer h-5 w-5 shrink-0 rounded-[4px] border border-brand-500/50 accent-accent-600 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
