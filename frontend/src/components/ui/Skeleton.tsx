import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** Бет жүктелгенде көрсетілетін жалпы қаңқа: тақырып + екі карточка. */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Загрузка">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
