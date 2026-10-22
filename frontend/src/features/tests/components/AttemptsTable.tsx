import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDate } from "@/lib/date";
import type { IAttemptRow } from "@/types";

interface IAttemptsTableProps {
  rows: IAttemptRow[];
}

export function AttemptsTable({ rows }: IAttemptsTableProps) {
  const passedCount = rows.filter((row) => row.attempts > 0).length;
  const hasRows = rows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Результаты</CardTitle>
          <CardDescription>
            Прошли {passedCount} из {rows.length} студентов
          </CardDescription>
        </div>
      </CardHeader>

      {hasRows ? (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="px-5 py-3 font-medium">
                  Студент
                </th>
                <th scope="col" className="px-3 py-3 text-right font-medium">
                  Попыток
                </th>
                <th scope="col" className="px-3 py-3 font-medium">
                  Последняя
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Лучший балл
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.student.id}
                  className="border-b border-border transition-colors duration-150 last:border-0 hover:bg-muted/50"
                >
                  <th scope="row" className="px-5 py-3 text-left font-medium">
                    <span className="block max-w-56 truncate">
                      {row.student.full_name ?? row.student.email}
                    </span>
                  </th>
                  <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">
                    {row.attempts}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                    {row.last_finished_at ? formatDate(row.last_finished_at) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {row.best_score === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      `${row.best_score}/${row.max_score}`
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="В группах дисциплины пока нет студентов"
          description="Результаты появятся, когда студенты пройдут тест."
          className="border-t border-border"
        />
      )}
    </Card>
  );
}
