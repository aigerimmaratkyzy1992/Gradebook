import { cn } from "@/lib/utils";
import type { ILesson } from "@/types";

import { DESKTOP_GRID_COLUMNS, WEEKDAYS, WORKDAY_COUNT } from "../constants";
import { getTodayWeekday, groupLessonsByWeekday } from "../utils";

import { DayColumn } from "./DayColumn";

interface IWeekViewProps {
  lessons: ILesson[];
  canManage: boolean;
  onEdit: (lesson: ILesson) => void;
  onDelete: (lessonId: number) => Promise<void>;
}

/** Кең экранда — апталық кесте (бағандар), тар экранда — күндер тізімі. */
export function WeekView({ lessons, canManage, onEdit, onDelete }: IWeekViewProps) {
  const lessonsByDay = groupLessonsByWeekday(lessons);
  const todayIndex = getTodayWeekday();
  const visibleDays = WEEKDAYS.map((title, index) => ({
    title,
    index,
    lessons: lessonsByDay[index] ?? [],
  })).filter((day) => day.index < WORKDAY_COUNT || day.lessons.length > 0);

  return (
    <div className={cn("grid gap-4 lg:gap-3", DESKTOP_GRID_COLUMNS[visibleDays.length])}>
      {visibleDays.map((day) => (
        <DayColumn
          key={day.index}
          title={day.title}
          lessons={day.lessons}
          isToday={day.index === todayIndex}
          canManage={canManage}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
