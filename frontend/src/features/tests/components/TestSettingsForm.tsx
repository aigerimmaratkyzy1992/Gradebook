import { Trash2 } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getErrorMessage } from "@/lib/api";
import { toLocalInput } from "@/lib/date";
import type { TestFull } from "@/types";

import type { ITestSettingsPayload } from "../types";
import { buildSettingsPayload } from "../utils";

type TestSettings = Pick<
  TestFull,
  | "title"
  | "description"
  | "time_limit_minutes"
  | "attempts_allowed"
  | "due_at"
  | "shuffle_questions"
  | "shuffle_options"
  | "show_result"
>;

interface ITestSettingsFormProps {
  test: TestSettings;
  onSave: (payload: ITestSettingsPayload) => Promise<void>;
  onDelete: () => Promise<void>;
}

const FLAG_FIELDS = [
  { name: "shuffle_questions", label: "Случайный порядок вопросов" },
  { name: "shuffle_options", label: "Случайный порядок вариантов" },
  { name: "show_result", label: "Показывать результат сразу" },
] as const;

export function TestSettingsForm({ test, onSave, onDelete }: ITestSettingsFormProps) {
  const formId = useId();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildSettingsPayload(new FormData(event.currentTarget));

    setError("");
    setIsSaving(true);
    try {
      await onSave(payload);
      toast.success("Настройки сохранены");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Параметры теста</CardTitle>
            <CardDescription>Название, ограничения и порядок вопросов.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <Field label="Название" htmlFor={`${formId}-title`}>
              <Input id={`${formId}-title`} name="title" defaultValue={test.title} required />
            </Field>

            <Field label="Описание" htmlFor={`${formId}-description`}>
              <Textarea
                id={`${formId}-description`}
                name="description"
                defaultValue={test.description ?? ""}
                placeholder="Что проверяет тест, на что обратить внимание"
                rows={2}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Время, минут"
                htmlFor={`${formId}-time`}
                hint="Пусто — без ограничения"
              >
                <Input
                  id={`${formId}-time`}
                  type="number"
                  name="time_limit_minutes"
                  defaultValue={test.time_limit_minutes ?? ""}
                  min={1}
                  max={600}
                />
              </Field>
              <Field label="Попыток" htmlFor={`${formId}-attempts`}>
                <Input
                  id={`${formId}-attempts`}
                  type="number"
                  name="attempts_allowed"
                  defaultValue={test.attempts_allowed}
                  min={1}
                  max={20}
                />
              </Field>
              <Field label="Срок сдачи" htmlFor={`${formId}-due`}>
                <Input
                  id={`${formId}-due`}
                  type="datetime-local"
                  name="due_at"
                  defaultValue={toLocalInput(test.due_at)}
                />
              </Field>
            </div>

            <fieldset className="space-y-2.5">
              <legend className="sr-only">Дополнительно</legend>
              {FLAG_FIELDS.map((flag) => (
                <label key={flag.name} className="flex w-fit items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    name={flag.name}
                    defaultChecked={test[flag.name]}
                    className="size-4 accent-primary"
                  />
                  {flag.label}
                </label>
              ))}
            </fieldset>

            <FormError message={error} />

            <Button type="submit" isLoading={isSaving}>
              Сохранить
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader className="items-center">
          <div>
            <CardTitle>Удаление теста</CardTitle>
            <CardDescription>Вопросы и все попытки студентов будут удалены.</CardDescription>
          </div>
          <ConfirmAction
            title={`Удалить тест «${test.title}»?`}
            description="Это действие нельзя отменить."
            onConfirm={onDelete}
          >
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 aria-hidden />
              Удалить тест
            </Button>
          </ConfirmAction>
        </CardHeader>
      </Card>
    </div>
  );
}
