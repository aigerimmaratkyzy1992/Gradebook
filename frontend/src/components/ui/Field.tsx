import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Label } from "./Label";

interface IFieldProps {
  label: string;
  /** Ішкі контролдың id-і: белгіні басқанда фокус соған өтеді. */
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

/** Белгі + контрол + көмекші мәтін — формалардағы бірыңғай жол. */
export function Field({ label, htmlFor, hint, className, children }: IFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
