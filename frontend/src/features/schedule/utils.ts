import type { GroupBrief, ICourse, ILesson } from "@/types";

import { WEEKDAYS } from "./constants";

/** Апта күндері бойынша топтайды, әр күн ішінде басталу уақытымен сұрыпталған. */
export function groupLessonsByWeekday(lessons: ILesson[]): ILesson[][] {
  const days: ILesson[][] = WEEKDAYS.map(() => []);
  for (const lesson of lessons) days[lesson.weekday]?.push(lesson);
  for (const day of days) day.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return days;
}

/** JS `getDay()` жексенбіден басталады, біздің индекс — дүйсенбіден. */
export function getTodayWeekday(): number {
  return (new Date().getDay() + 6) % 7;
}

/**
 * Сабаққа таңдауға болатын топтар: дисциплина тағайындалған әрі пайдаланушыға
 * көрінетін топтар (backend те соны талап етеді). Өңдеуде сабақтың ағымдағы
 * тобы әрқашан тізімде — әйтпесе select басқа топқа түсіп, сабақ байқаусызда
 * көшіп кетер еді. Өңдеуде дисциплина тізімде табылмаса — барлық топ.
 */
export function getAvailableGroups(
  course: Pick<ICourse, "groups"> | undefined,
  groups: GroupBrief[],
  currentGroup?: GroupBrief,
): GroupBrief[] {
  const isEditing = currentGroup !== undefined;
  const linked = course
    ? groups.filter((group) => course.groups.some((item) => item.id === group.id))
    : isEditing
      ? groups
      : [];
  const isCurrentMissing =
    currentGroup !== undefined && !linked.some((group) => group.id === currentGroup.id);
  return isCurrentMissing ? [currentGroup, ...linked] : linked;
}
