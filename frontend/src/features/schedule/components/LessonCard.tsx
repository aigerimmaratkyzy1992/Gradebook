import { MapPin, Pencil, Trash2, Users } from "lucide-react";
import { Link } from "react-router";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { IconAction } from "@/components/shared/IconAction";
import { ROUTES } from "@/constants/routes";
import { formatTime } from "@/lib/date";
import type { ILesson } from "@/types";

interface ILessonCardProps {
  lesson: ILesson;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

/** Мобильде — көлденең жол, кең экранда — тар бағанға арналған тік карточка. */
export function LessonCard({ lesson, canManage, onEdit, onDelete }: ILessonCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 lg:flex-col lg:gap-1.5 lg:p-2.5">
      <p className="w-24 shrink-0 pt-px text-sm font-medium tabular-nums lg:w-auto lg:pt-0 lg:text-xs lg:text-muted-foreground">
        <time>{formatTime(lesson.starts_at)}</time>–<time>{formatTime(lesson.ends_at)}</time>
      </p>

      <div className="min-w-0 flex-1 space-y-1 lg:w-full">
        <Link
          to={ROUTES.course(lesson.course.id)}
          className="block text-sm leading-snug font-medium break-words underline-offset-4 hover:underline"
        >
          {lesson.course.name}
        </Link>
        <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <Users className="size-3 shrink-0" aria-hidden />
            <span className="sr-only">Группа:</span>
            <span className="truncate">{lesson.group.name}</span>
          </span>
          {lesson.room && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="sr-only">Аудитория:</span>
              <span className="truncate">{lesson.room}</span>
            </span>
          )}
        </p>
      </div>

      {canManage && (
        <div className="-my-1 flex shrink-0 items-center gap-0.5 lg:-mx-1 lg:my-0 lg:self-end">
          <IconAction label="Изменить" onClick={onEdit}>
            <Pencil />
          </IconAction>
          <ConfirmAction
            title="Удалить занятие из расписания?"
            description={`${lesson.course.name} · ${lesson.group.name}, ${formatTime(lesson.starts_at)}`}
            onConfirm={onDelete}
          >
            <IconAction label="Удалить" className="hover:text-destructive">
              <Trash2 />
            </IconAction>
          </ConfirmAction>
        </div>
      )}
    </div>
  );
}
