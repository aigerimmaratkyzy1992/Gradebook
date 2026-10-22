import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

import { TIMER_WARNING_SECONDS } from "../constants";
import { formatTimer } from "../utils";

interface ITimerBarProps {
  /** null — тест таймерсіз, тек прогресс көрсетіледі. */
  secondsLeft: number | null;
  answeredCount: number;
  totalCount: number;
}

/** Беттің жоғарғы жағына жабысатын жолақ: қалған уақыт пен жауап прогресі. */
export function TimerBar({ secondsLeft, answeredCount, totalCount }: ITimerBarProps) {
  const isRunningOut = secondsLeft !== null && secondsLeft < TIMER_WARNING_SECONDS;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  return (
    <div
      className={cn(
        "sticky top-16 z-30 -mx-1 overflow-hidden rounded-xl border bg-card/95 backdrop-blur-sm transition-colors duration-200",
        isRunningOut ? "border-destructive/50" : "border-border",
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Отвечено{" "}
          <span className="font-medium text-foreground tabular-nums">
            {answeredCount} из {totalCount}
          </span>
        </span>
        {secondsLeft !== null && (
          <span
            role="timer"
            aria-label={`Осталось ${formatTimer(secondsLeft)}`}
            className={cn(
              "ml-auto flex items-center gap-1.5 font-semibold tabular-nums",
              isRunningOut && "text-destructive",
            )}
          >
            <Clock className="size-4" aria-hidden />
            {formatTimer(secondsLeft)}
          </span>
        )}
        {/* Секунд сайын оқымау үшін — тек бір рет ескертеміз. */}
        <span className="sr-only" aria-live="polite">
          {isRunningOut ? "Осталось меньше минуты" : ""}
        </span>
      </div>
      <div className="h-0.5 bg-muted" aria-hidden>
        <div
          className="h-full bg-chart-1 transition-[width] duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
