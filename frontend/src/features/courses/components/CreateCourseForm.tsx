import { Plus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { TeacherSelect } from "@/components/shared/TeacherSelect";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api";
import { parseOptionalId, readFormText } from "@/lib/form";
import type { INameTeacherValues, IUser } from "@/types";

interface ICreateCourseFormProps {
  teachers: IUser[];
  canAssignTeacher: boolean;
  onCreate: (values: INameTeacherValues) => Promise<void>;
}

export function CreateCourseForm({ teachers, canAssignTeacher, onCreate }: ICreateCourseFormProps) {
  const id = useId();
  const [teacherId, setTeacherId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = readFormText(new FormData(form), "name");

    setError("");
    setIsSaving(true);
    try {
      await onCreate({ name, teacher_id: parseOptionalId(teacherId) });
      form.reset();
      setTeacherId("");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Название" htmlFor={`${id}-name`} className="sm:flex-1">
          <Input
            id={`${id}-name`}
            name="name"
            placeholder="Например, Базы данных"
            required
          />
        </Field>
        {canAssignTeacher && (
          <Field label="Преподаватель" htmlFor={`${id}-teacher`} className="sm:w-64">
            <TeacherSelect
              id={`${id}-teacher`}
              teachers={teachers}
              value={teacherId}
              onChange={setTeacherId}
            />
          </Field>
        )}
        <Button type="submit" isLoading={isSaving}>
          {!isSaving && <Plus aria-hidden />}
          Создать
        </Button>
      </div>
      <FormError message={error} />
    </form>
  );
}
