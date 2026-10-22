import { ChevronRight, Pencil, Trash2, Users } from "lucide-react";
import { Link } from "react-router";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { IconAction } from "@/components/shared/IconAction";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/constants/routes";
import { getTeacherLabel } from "@/lib/utils";
import type { IGroup } from "@/types";

interface IGroupRowProps {
  group: Pick<IGroup, "id" | "name" | "teacher" | "students_count">;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}

export function GroupRow({ group, onEdit, onDelete }: IGroupRowProps) {
  return (
    // Сілтеменің ::after қабаты бүкіл жолды басылатын етеді, түймелер z-10 арқылы үстінде.
    <div className="group relative flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-accent/60">
      <div className="min-w-0 flex-1">
        <Link
          to={ROUTES.group(group.id)}
          className="inline-flex max-w-full items-center gap-1 text-sm font-medium after:absolute after:inset-0"
        >
          <span className="truncate">{group.name}</span>
          <ChevronRight
            className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
        <p className="truncate text-sm text-muted-foreground">{getTeacherLabel(group.teacher)}</p>
      </div>

      <Badge variant="outline" className="tabular-nums">
        <Users aria-hidden />
        {group.students_count} студ.
      </Badge>

      <div className="relative z-10 flex items-center gap-0.5">
        <IconAction label="Изменить" onClick={onEdit}>
          <Pencil />
        </IconAction>
        <ConfirmAction
          title={`Удалить группу «${group.name}»?`}
          description="Студенты останутся в системе, но будут исключены из группы."
          onConfirm={onDelete}
        >
          <IconAction label="Удалить" className="hover:text-destructive">
            <Trash2 />
          </IconAction>
        </ConfirmAction>
      </div>
    </div>
  );
}
