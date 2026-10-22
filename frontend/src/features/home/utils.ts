import {
  CalendarClock,
  CircleCheck,
  ClipboardList,
  Hourglass,
  LibraryBig,
  TriangleAlert,
} from "lucide-react";

import type { IStatTile } from "@/components/shared/StatTile";
import { isOverdue } from "@/lib/date";
import { getPercent } from "@/lib/score";
import type { IMyAssignment } from "@/types";

import { WEEK_MS, type AssignmentFilter } from "./constants";

/** Студент әлі тапсыруы керек: мүлде тапсырмаған немесе доработкаға қайтарылған. */
export function getIsPending(item: Pick<IMyAssignment, "status">): boolean {
  return item.status === null || item.status === "revision";
}

/** Мерзімі өтіп, бірақ ештеңе тапсырылмаған тапсырма. */
export function getIsItemOverdue(item: Pick<IMyAssignment, "status" | "due_at">): boolean {
  return item.status === null && isOverdue(item.due_at);
}

export function matchesFilter(item: IMyAssignment, filter: AssignmentFilter): boolean {
  if (filter === "pending") return getIsPending(item);
  if (filter === "done") return !getIsPending(item);
  return true;
}

function getIsDueThisWeek(dueAt: string | null): boolean {
  if (!dueAt) return false;
  const left = new Date(dueAt).getTime() - Date.now();
  return left >= 0 && left <= WEEK_MS;
}

function countWhere(items: IMyAssignment[], predicate: (item: IMyAssignment) => boolean) {
  return items.filter(predicate).length;
}

export function getStudentTiles(items: IMyAssignment[]): IStatTile[] {
  const reviewed = items.filter((item) => item.status === "reviewed");
  const scored = reviewed.filter((item) => item.score !== null);
  const scoreSum = scored.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const maxSum = scored.reduce((sum, item) => sum + item.max_score, 0);
  const averageHint =
    maxSum > 0 ? `Средний результат ${getPercent(scoreSum, maxSum)}%` : undefined;

  return [
    { label: "К сдаче", value: countWhere(items, getIsPending), icon: ClipboardList },
    {
      label: "Просрочено",
      value: countWhere(items, getIsItemOverdue),
      icon: TriangleAlert,
      isAlert: true,
    },
    {
      label: "На проверке",
      value: countWhere(items, (item) => item.status === "submitted"),
      icon: Hourglass,
    },
    { label: "Проверено", value: reviewed.length, icon: CircleCheck, hint: averageHint },
  ];
}

export function getStaffTiles(items: IMyAssignment[]): IStatTile[] {
  const courseCount = new Set(items.map((item) => item.course_id)).size;

  return [
    { label: "Заданий", value: items.length, icon: ClipboardList },
    { label: "Дисциплин", value: courseCount, icon: LibraryBig },
    {
      label: "Срок на неделе",
      value: countWhere(items, (item) => getIsDueThisWeek(item.due_at)),
      icon: CalendarClock,
    },
    {
      label: "Срок истёк",
      value: countWhere(items, (item) => isOverdue(item.due_at)),
      icon: TriangleAlert,
    },
  ];
}
