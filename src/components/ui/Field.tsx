import * as React from "react";
import { Label, ErrorMessage } from "./Input";
import { cn } from "../../utils";

interface FieldProps {
  label: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  description?: string;
}

export function Field({
  label,
  error,
  htmlFor,
  children,
  className,
  description,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {description && (
        <p className="text-sm text-neutral-600 -mt-1 mb-1">{description}</p>
      )}
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
