import { CalendarClock } from "lucide-react";
import { Link } from "react-router";

import { StatusBadge } from "@/components/shared/StatusBadge";
import { ROUTES } from "@/constants/routes";
import { formatDate } from "@/lib/date";
import { formatScore } from "@/lib/score";
import { cn } from "@/lib/utils";
import type { IMyAssignment } from "@/types";

import { getIsItemOverdue } from "../utils";

interface IAssignmentRowProps {
  item: IMyAssignment;
  isStudent: boolean;
}

export function AssignmentRow({ item, isStudent }: IAssignmentRowProps) {
  const isItemOverdue = getIsItemOverdue(item);
  const scoreText = item.score === null ? "—" : formatScore(item.score, item.max_score);

  return (
    <li className="flex flex-col gap-2 px-5 py-3.5 transition-colors duration-150 hover:bg-accent/50 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <Link
          to={ROUTES.assignment(item.id)}
          className="block truncate text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
        <p className="truncate text-sm text-muted-foreground">
          <Link
            to={ROUTES.course(item.course_id)}
            className="transition-colors hover:text-foreground"
          >
            {item.course_name}
          </Link>
          {" · "}
          {item.topic_title}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:justify-end">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-sm",
            isItemOverdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          {formatDate(item.due_at)}
          {isItemOverdue && <span className="sr-only">(срок истёк)</span>}
        </span>
        {isStudent ? (
          <>
            <span className="w-14 text-right text-sm font-medium tabular-nums">
              <span className="sr-only">Балл: </span>
              {scoreText}
            </span>
            <StatusBadge status={item.status} />
          </>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">
            {item.max_score} б.
          </span>
        )}
      </div>
    </li>
  );
}
