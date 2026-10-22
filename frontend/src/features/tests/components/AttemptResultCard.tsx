import { CircleCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";
import type { IAttemptResult } from "@/types";

import { getPercent } from "../utils";

interface IAttemptResultCardProps {
  result: Pick<IAttemptResult, "score" | "max_score" | "show_result">;
}

export function AttemptResultCard({ result }: IAttemptResultCardProps) {
  const percent = getPercent(result.score, result.max_score);

  return (
    <Card role="status">
      <CardContent className="flex items-start gap-4 pt-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <CircleCheck className="size-5" aria-hidden />
        </span>

        {result.show_result ? (
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Тест завершён. Ваш результат</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {result.score}
                <span className="text-lg font-normal text-muted-foreground">
                  {" "}
                  из {result.max_score}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-chart-1" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-sm font-medium tabular-nums">{percent}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-medium">Работа принята</p>
            <p className="text-sm text-muted-foreground">Результат покажет преподаватель.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
