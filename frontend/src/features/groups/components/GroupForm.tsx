import { useId, useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { TeacherSelect } from "@/components/shared/TeacherSelect";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api";
import { parseOptionalId, readFormText } from "@/lib/form";
import type { IGroup, INameTeacherValues, IUser } from "@/types";

interface IGroupFormProps {
  defaultValues?: Pick<IGroup, "name" | "teacher">;
  teachers: IUser[];
  canAssignTeacher: boolean;
  submitLabel: string;
  shouldResetOnSuccess?: boolean;
  shouldAutoFocus?: boolean;
  onSubmit: (values: INameTeacherValues) => Promise<void>;
  onCancel?: () => void;
}

/** Топ құру мен өңдеуге ортақ форма: атауы + (admin үшін) преподаватель. */
export function GroupForm({
  defaultValues,
  teachers,
  canAssignTeacher,
  submitLabel,
  shouldResetOnSuccess = false,
  shouldAutoFocus = false,
  onSubmit,
  onCancel,
}: IGroupFormProps) {
  const id = useId();
  const initialTeacherId = String(defaultValues?.teacher?.id ?? "");
  const [teacherId, setTeacherId] = useState(initialTeacherId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = readFormText(new FormData(form), "name");

    setError("");
    setIsSaving(true);
    try {
      // Преподаватель өрісі жоқ болса да null жібереміз: backend оны
      // admin емес пайдаланушы үшін елемейді.
      await onSubmit({
        name,
        teacher_id: canAssignTeacher ? parseOptionalId(teacherId) : null,
      });
      if (shouldResetOnSuccess) {
        form.reset();
        setTeacherId(initialTeacherId);
      }
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
            defaultValue={defaultValues?.name}
            placeholder="Например, ИС-21"
            autoFocus={shouldAutoFocus}
            required
          />
        </Field>
        {canAssignTeacher && (
          <Field label="Преподаватель" htmlFor={`${id}-teacher`} className="sm:w-64">
            <TeacherSelect
              id={`${id}-teacher`}
              teachers={teachers}
              currentTeacher={defaultValues?.teacher}
              value={teacherId}
              onChange={setTeacherId}
            />
          </Field>
        )}
        <div className="flex gap-2">
          <Button type="submit" isLoading={isSaving}>
            {submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
              Отмена
            </Button>
          )}
        </div>
      </div>
      <FormError message={error} />
    </form>
  );
}
