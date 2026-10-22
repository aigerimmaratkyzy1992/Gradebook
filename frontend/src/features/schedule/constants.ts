/** Индекс backend-тегі `Lesson.weekday`-ке сәйкес: 0 — дүйсенбі. */
export const WEEKDAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
] as const;

/** Демалыс күндері сабақ болмаса, кестеде бағаны көрсетілмейді. */
export const WORKDAY_COUNT = 5;

/** Tailwind кластары статикалық болуы керек — динамикалық жолды ол көрмейді. */
export const DESKTOP_GRID_COLUMNS: Record<number, string> = {
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-6",
  7: "lg:grid-cols-7",
};
