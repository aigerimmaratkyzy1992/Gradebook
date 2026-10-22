import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-[13px] leading-none font-medium text-foreground select-none peer-disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
