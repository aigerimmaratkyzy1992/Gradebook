import { UserPlus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { getErrorMessage } from "@/lib/api";
import type { IUser } from "@/types";

interface IStudentPickerProps {
  /** Топта әлі жоқ студенттер ғана. */
  students: Pick<IUser, "id" | "email" | "full_name">[];
  onAdd: (email: string) => Promise<void>;
}

export function StudentPicker({ students, onAdd }: IStudentPickerProps) {
  const id = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const hasStudents = students.length > 0;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    if (!email) return;

    setError("");
    setIsAdding(true);
    try {
      await onAdd(email);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">
          Студент
        </label>
        <NativeSelect id={id} name="email" disabled={!hasStudents} className="sm:flex-1">
          {!hasStudents && <option value="">Нет свободных студентов</option>}
          {students.map((student) => (
            <option key={student.id} value={student.email}>
              {student.full_name ? `${student.full_name} — ` : ""}
              {student.email}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" isLoading={isAdding} disabled={!hasStudents}>
          {!isAdding && <UserPlus aria-hidden />}
          Добавить
        </Button>
      </div>
      {!hasStudents && (
        <p className="text-xs text-muted-foreground">
          Свободных студентов нет. Аккаунты создаёт администратор на странице
          «Пользователи».
        </p>
      )}
      <FormError message={error} />
    </form>
  );
}
