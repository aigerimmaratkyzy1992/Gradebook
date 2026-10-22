import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

import { fieldControlClass } from "./Input";

/**
 * Нативті <select>: FormData-мен тікелей жұмыс істейді және мобильде
 * жүйелік таңдау терезесін ашады.
 */
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(fieldControlClass, "h-10 appearance-none pr-9")}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
