import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface IStatTile {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  /** Нөлден үлкен болса, назар аудару үшін қызылмен көрсетіледі. */
  isAlert?: boolean;
}

/**
 * Сводка көрсеткіші. `<dl>` ішінде қолданылады: <dt> — атауы, <dd> — мәні
 * (<dl>-дің тікелей баласы ретінде тек <div> рұқсат).
 */
export function StatTile({ label, value, icon: Icon, hint, isAlert = false }: IStatTile) {
  const isHighlighted = isAlert && Number(value) > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <dt className="truncate text-sm text-muted-foreground">{label}</dt>
        <Icon
          className={cn(
            "size-4 shrink-0",
            isHighlighted ? "text-destructive" : "text-muted-foreground",
          )}
          aria-hidden
        />
      </div>
      <dd
        className={cn(
          "mt-2 text-2xl font-semibold tracking-tight tabular-nums",
          isHighlighted && "text-destructive",
        )}
      >
        {value}
      </dd>
      {hint && <dd className="mt-1 truncate text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}
