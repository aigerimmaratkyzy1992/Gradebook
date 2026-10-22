import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export const fieldControlClass =
  "w-full min-w-0 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive";

export function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        fieldControlClass,
        "h-10 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        type === "file" && "py-2",
        className,
      )}
      {...props}
    />
  );
}
