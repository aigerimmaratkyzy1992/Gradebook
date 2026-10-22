import { UserMinus } from "lucide-react";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { IconAction } from "@/components/shared/IconAction";
import { getDisplayName, getInitials } from "@/lib/utils";
import type { IUser } from "@/types";

interface IStudentRowProps {
  student: Pick<IUser, "email" | "full_name">;
  onRemove: () => Promise<void>;
}

export function StudentRow({ student, onRemove }: IStudentRowProps) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent/60">
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground"
        aria-hidden
      >
        {getInitials(student.full_name, student.email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{getDisplayName(student)}</p>
        {student.full_name && (
          <p className="truncate text-xs text-muted-foreground">{student.email}</p>
        )}
      </div>
      <ConfirmAction
        title={`Убрать ${student.email} из группы?`}
        description="Аккаунт студента сохранится, его можно будет добавить снова."
        confirmLabel="Убрать"
        onConfirm={onRemove}
      >
        <IconAction label="Убрать из группы" className="hover:text-destructive">
          <UserMinus />
        </IconAction>
      </ConfirmAction>
    </div>
  );
}
