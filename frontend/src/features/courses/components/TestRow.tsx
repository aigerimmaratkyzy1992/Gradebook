import { ListChecks } from "lucide-react";
import { Link } from "react-router";

import { Deadline } from "@/components/shared/Deadline";
import { ROUTES } from "@/constants/routes";
import type { ITestBrief } from "@/types";

interface ITestRowProps {
  test: Pick<ITestBrief, "id" | "title" | "time_limit_minutes" | "attempts_allowed" | "due_at">;
  /** Преподаватель редакторға, студент тапсыруға өтеді. */
  canManage: boolean;
}

export function TestRow({ test, canManage }: ITestRowProps) {
  const href = canManage ? ROUTES.testEdit(test.id) : ROUTES.test(test.id);
  const timeLimit = test.time_limit_minutes ? `${test.time_limit_minutes} мин` : "без таймера";

  return (
    <li>
      <Link
        to={href}
        className="flex flex-col gap-1 px-5 py-3 transition-colors duration-150 hover:bg-accent sm:flex-row sm:items-center sm:gap-4 sm:pl-11"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <ListChecks className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate text-sm">Тест: {test.title}</span>
        </span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6 text-sm text-muted-foreground sm:pl-0">
          <span>
            {timeLimit} · попыток: {test.attempts_allowed}
          </span>
          <Deadline dueAt={test.due_at} />
        </span>
      </Link>
    </li>
  );
}
