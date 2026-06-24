import * as React from "react"
import { cn } from "../../utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', ...props }, ref) => {
    
    const variants = {
      primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-lg shadow-brand-700/20 font-bold",
      secondary: "bg-brand-50 text-brand-800 hover:bg-rose-100 font-bold",
      outline: "border border-brand-500/20 bg-white hover:bg-brand-50 text-neutral-900 transition-colors font-bold",
      ghost: "hover:bg-brand-50 text-neutral-600 transition-colors font-bold",
    };

    const sizes = {
      default: "min-h-[44px] px-6 py-3 rounded-xl text-sm",
      sm: "h-9 rounded-lg px-4 text-xs",
      lg: "min-h-[44px] rounded-xl px-8 text-sm",
      icon: "min-h-[44px] min-w-[44px] rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
