import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

import { FADE_ITEM_MOTION } from "@/constants/motion";
import { cn } from "@/lib/utils";
import type { ILesson } from "@/types";

import { LessonCard } from "./LessonCard";

interface IDayColumnProps {
  title: string;
  lessons: ILesson[];
  isToday: boolean;
  canManage: boolean;
  onEdit: (lesson: ILesson) => void;
  onDelete: (lessonId: number) => Promise<void>;
}

export function DayColumn({
  title,
  lessons,
  isToday,
  canManage,
  onEdit,
  onDelete,
}: IDayColumnProps) {
  const headingId = useId();
  const hasLessons = lessons.length > 0;

  return (
    <section
      aria-labelledby={headingId}
      // Мобильдегі тізімде бос күндер орын алмасын — тек кең экрандағы кестеде көрінеді.
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card",
        !hasLessons && "max-lg:hidden",
      )}
    >
      <header
        className={cn(
          "flex items-center gap-2 border-b border-border px-4 py-3 lg:px-3 lg:py-2.5",
          isToday && "bg-accent",
        )}
      >
        <h2 id={headingId} className="min-w-0 truncate text-sm font-semibold">
          {title}
        </h2>
        {isToday && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="lg:sr-only">Сегодня</span>
          </span>
        )}
        <span
          className="ml-auto text-xs text-muted-foreground tabular-nums lg:hidden"
          aria-hidden
        >
          {lessons.length}
        </span>
      </header>

      {hasLessons ? (
        <ul className="space-y-2 p-3 lg:p-2">
          <AnimatePresence initial={false}>
            {lessons.map((lesson) => (
              <motion.li key={lesson.id} layout="position" {...FADE_ITEM_MOTION}>
                <LessonCard
                  lesson={lesson}
                  canManage={canManage}
                  onEdit={() => onEdit(lesson)}
                  onDelete={() => onDelete(lesson.id)}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="flex flex-1 items-center justify-center px-3 py-8 text-xs text-muted-foreground">
          Нет занятий
        </p>
      )}
    </section>
  );
}
