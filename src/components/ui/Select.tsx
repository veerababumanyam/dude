import * as React from "react";
import { cn } from "../../utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            "flex min-h-[44px] w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-700 disabled:cursor-not-allowed disabled:opacity-50 outline-none",
            error
              ? "border-status-error focus-visible:ring-status-error"
              : "border-brand-500/20",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
