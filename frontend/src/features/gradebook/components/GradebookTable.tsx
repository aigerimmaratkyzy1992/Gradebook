import { ClipboardList, Users } from "lucide-react";
import { Link } from "react-router";

import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { NOT_SUBMITTED_LABEL, STATUS_LABELS } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";
import { PLURAL_FORMS, pluralize } from "@/lib/plural";
import { cn, getDisplayName } from "@/lib/utils";
import type { IGradebook, IGradebookCell } from "@/types";

export function GradebookTable({ book }: { book: IGradebook }) {
  const hasColumns = book.columns.length > 0;
  const hasRows = book.rows.length > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Оценки</CardTitle>
          <CardDescription>
            {pluralize(book.rows.length, PLURAL_FORMS.student)} ·{" "}
            {pluralize(book.columns.length, PLURAL_FORMS.assignment)}
          </CardDescription>
        </div>
      </CardHeader>

      {!hasColumns && (
        <EmptyState
          icon={ClipboardList}
          title="В дисциплине пока нет заданий"
          description="Добавьте задания в темы дисциплины — здесь появятся колонки журнала."
          className="border-t border-border"
        />
      )}

      {hasColumns && !hasRows && (
        <EmptyState
          icon={Users}
          title="В группах дисциплины пока нет студентов"
          description="Назначьте дисциплину группе со студентами."
          className="border-t border-border"
        />
      )}

      {hasColumns && hasRows && (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th
                  scope="col"
                  className="sticky left-0 z-10 border-r border-b border-border bg-card px-5 py-3 font-medium"
                >
                  Студент
                </th>
                {book.columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className="max-w-40 min-w-28 border-b border-border px-3 py-3 text-center font-medium"
                  >
                    <Link
                      to={ROUTES.assignment(column.id)}
                      className="block truncate transition-colors duration-150 hover:text-foreground"
                      title={`${column.topic_title} · ${column.title}`}
                    >
                      {column.title}
                    </Link>
                    <span className="text-xs font-normal">из {column.max_score}</span>
                  </th>
                ))}
                <th
                  scope="col"
                  className="border-b border-border px-5 py-3 text-right font-medium"
                >
                  Средний
                </th>
              </tr>
            </thead>
            <tbody>
              {book.rows.map((row) => (
                <tr key={row.student.id} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-b border-border bg-card px-5 py-3 text-left font-medium transition-colors duration-150 group-last:border-b-0 group-hover:bg-muted"
                  >
                    <span className="block max-w-56 truncate">{getDisplayName(row.student)}</span>
                  </th>
                  {row.cells.map((cell) => (
                    <td
                      key={cell.assignment_id}
                      className="border-b border-border px-3 py-3 text-center transition-colors duration-150 group-last:border-b-0 group-hover:bg-muted"
                    >
                      <GradeCell cell={cell} />
                    </td>
                  ))}
                  <td className="border-b border-border px-5 py-3 text-right font-semibold tabular-nums transition-colors duration-150 group-last:border-b-0 group-hover:bg-muted">
                    {row.average ?? <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/** Балл бар болса — сан (доработкада — қызыл), жоқ болса — күй белгісі не сызықша. */
function GradeCell({ cell }: { cell: Pick<IGradebookCell, "score" | "status"> }) {
  if (cell.score !== null) {
    const isRevision = cell.status === "revision";

    return (
      <span
        className={cn("tabular-nums", isRevision && "font-medium text-destructive")}
        title={isRevision ? STATUS_LABELS.revision : undefined}
      >
        {cell.score}
        {isRevision && <span className="sr-only"> ({STATUS_LABELS.revision})</span>}
      </span>
    );
  }

  if (cell.status) return <StatusBadge status={cell.status} />;

  return (
    <span className="text-muted-foreground">
      <span aria-hidden>—</span>
      <span className="sr-only">{NOT_SUBMITTED_LABEL}</span>
    </span>
  );
}
