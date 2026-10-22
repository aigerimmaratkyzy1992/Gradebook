import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { fieldControlClass } from "./Input";

export function Textarea({ className, rows = 4, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(fieldControlClass, "min-h-20 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}
