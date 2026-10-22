import { useId, useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { TeacherSelect } from "@/components/shared/TeacherSelect";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api";
import { parseOptionalId, readFormText } from "@/lib/form";
import type { ICourse, INameTeacherValues, IUser } from "@/types";

interface ICourseCardEditFormProps {
  course: Pick<ICourse, "name" | "teacher">;
  teachers: IUser[];
  canAssignTeacher: boolean;
  onSubmit: (values: INameTeacherValues) => Promise<void>;
  onCancel: () => void;
}

/** Тізімдегі карточканың ішіндегі жылдам өңдеу: атауы мен преподаватель. */
export function CourseCardEditForm({
  course,
  teachers,
  canAssignTeacher,
  onSubmit,
  onCancel,
}: ICourseCardEditFormProps) {
  const id = useId();
  const [teacherId, setTeacherId] = useState(String(course.teacher?.id ?? ""));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = readFormText(new FormData(event.currentTarget), "name");

    setError("");
    setIsSaving(true);
    try {
      await onSubmit({ name, teacher_id: parseOptionalId(teacherId) });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <Field label="Название" htmlFor={`${id}-name`}>
        <Input
          id={`${id}-name`}
          name="name"
          defaultValue={course.name}
          autoFocus
          required
        />
      </Field>
      {canAssignTeacher && (
        <Field label="Преподаватель" htmlFor={`${id}-teacher`}>
          <TeacherSelect
            id={`${id}-teacher`}
            teachers={teachers}
            currentTeacher={course.teacher}
            value={teacherId}
            onChange={setTeacherId}
          />
        </Field>
      )}
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Отмена
        </Button>
        <Button type="submit" isLoading={isSaving}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
