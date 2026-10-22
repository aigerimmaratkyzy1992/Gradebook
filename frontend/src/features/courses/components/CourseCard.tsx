import { BookOpen, Pencil, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { IconAction } from "@/components/shared/IconAction";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { NO_TEACHER_LABEL } from "@/constants/labels";
import { ROUTES } from "@/constants/routes";
import { getDisplayName } from "@/lib/utils";
import type { ICourse } from "@/types";

interface ICourseCardProps {
  course: Pick<ICourse, "id" | "name" | "description" | "teacher" | "groups">;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function CourseCard({ course, canManage, onEdit, onDelete }: ICourseCardProps) {
  const teacherLabel = course.teacher ? getDisplayName(course.teacher) : NO_TEACHER_LABEL;
  const hasGroups = course.groups.length > 0;

  return (
    // Сілтеменің ::after қабаты бүкіл карточканы басылатын етеді, түймелер z-10 арқылы үстінде.
    <Card className="group relative flex h-full flex-col gap-4 p-5 transition-colors duration-150 hover:border-foreground/25">
      <div className="flex items-start gap-3">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
          aria-hidden
        >
          <BookOpen className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-semibold break-words">
            <Link
              to={ROUTES.course(course.id)}
              className="underline-offset-4 group-hover:underline after:absolute after:inset-0 after:rounded-xl"
            >
              {course.name}
            </Link>
          </h2>
          {course.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {course.description}
            </p>
          )}
        </div>
        {canManage && (
          <div className="relative z-10 -mt-1 -mr-2 flex shrink-0 items-center gap-0.5">
            <IconAction label="Изменить" onClick={onEdit}>
              <Pencil />
            </IconAction>
            <ConfirmAction
              title={`Удалить дисциплину «${course.name}»?`}
              description="Вместе с ней будут удалены все темы и задания."
              onConfirm={onDelete}
            >
              <IconAction label="Удалить" className="hover:text-destructive">
                <Trash2 />
              </IconAction>
            </ConfirmAction>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="size-4 shrink-0" aria-hidden />
          <span className="sr-only">Преподаватель:</span>
          <span className="truncate">{teacherLabel}</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {hasGroups ? (
            course.groups.map((group) => (
              <Badge key={group.id} variant="outline">
                {group.name}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="border-dashed">
              Нет групп
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
