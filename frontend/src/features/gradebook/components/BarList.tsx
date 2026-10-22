import { cn } from "@/lib/utils";

import type { IBar } from "../utils";

interface IBarListProps {
  bars: IBar[];
  /** Толтыру түсі — тақырып токендерінен (bg-chart-1/2/3), қараңғы режимде де дұрыс. */
  barClassName?: string;
  /** Тізімнің қолжетімді атауы — графиктің тақырыбы. */
  labelledBy: string;
}

/** Қарапайым көлденең диаграмма — қосымша кітапханасыз. */
export function BarList({ bars, barClassName = "bg-chart-1", labelledBy }: IBarListProps) {
  return (
    <ul aria-labelledby={labelledBy} className="space-y-2.5">
      {bars.map((bar) => (
        <li key={bar.key} className="flex items-center gap-3">
          <span
            className="w-24 shrink-0 truncate text-sm text-muted-foreground sm:w-40"
            title={bar.label}
          >
            {bar.label}
          </span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className={cn("block h-full rounded-full transition-[width] duration-300", barClassName)}
              style={{ width: `${bar.percent}%` }}
            />
          </span>
          <span className="w-12 shrink-0 text-right text-sm font-medium tabular-nums">
            {bar.caption}
          </span>
        </li>
      ))}
    </ul>
  );
}
