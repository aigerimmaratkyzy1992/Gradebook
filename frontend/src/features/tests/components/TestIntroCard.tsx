import { Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/date";
import type { IAttemptResult } from "@/types";

interface ITestIntroCardProps {
  history: IAttemptResult[];
  isStarting: boolean;
  onStart: () => void;
}

/** Тест басталғанға дейін: бұрынғы әрекеттер және бастау түймесі. */
export function TestIntroCard({ history, isStarting, onStart }: ITestIntroCardProps) {
  const hasHistory = history.length > 0;
  const StartIcon = hasHistory ? RotateCcw : Play;
  const startLabel = hasHistory ? "Пройти ещё раз" : "Начать тест";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{hasHistory ? "Ваши попытки" : "Готовы начать?"}</CardTitle>
          <CardDescription>
            Если у теста есть ограничение времени, таймер запустится сразу после старта, а по его
            окончании ответы отправятся автоматически.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasHistory && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {history.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 text-muted-foreground">
                  Попытка {index + 1} · {formatDate(item.finished_at)}
                </span>
                <span className="font-medium tabular-nums">
                  {item.show_result ? `${item.score}/${item.max_score}` : "принято"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <Button onClick={onStart} isLoading={isStarting}>
          {!isStarting && <StartIcon aria-hidden />}
          {startLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
