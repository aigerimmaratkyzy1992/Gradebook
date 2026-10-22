import { useId, type ReactNode } from "react";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toLocalInput } from "@/lib/date";

import { MAX_SCORE_LIMIT, NEW_ASSIGNMENT_MAX_SCORE } from "../constants";
import type { AssignmentPayload } from "../types";

interface IAssignmentFieldsProps {
  defaults?: AssignmentPayload;
  shouldAutoFocus?: boolean;
  /** Файл таңдау өрісінің үстінде көрсетіледі (мыс. тіркелген файлдар тізімі). */
  attachedFiles?: ReactNode;
}

/**
 * Тапсырма өрістері — құру мен өңдеу формаларына ортақ. Аттары
 * `getAssignmentPayload` және `uploadAssignmentFiles` күтетін атаулармен бірдей.
 */
export function AssignmentFields({
  defaults,
  shouldAutoFocus = false,
  attachedFiles,
}: IAssignmentFieldsProps) {
  const id = useId();

  return (
    <div className="grid gap-4">
      <Field label="Название" htmlFor={`${id}-title`}>
        <Input
          id={`${id}-title`}
          name="title"
          defaultValue={defaults?.title}
          required
          autoFocus={shouldAutoFocus}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Срок сдачи" htmlFor={`${id}-due`} hint="Оставьте пустым, если срока нет">
          <Input
            id={`${id}-due`}
            type="datetime-local"
            name="due_at"
            defaultValue={toLocalInput(defaults?.due_at ?? null)}
          />
        </Field>
        <Field label="Максимальный балл" htmlFor={`${id}-score`}>
          <Input
            id={`${id}-score`}
            type="number"
            name="max_score"
            defaultValue={defaults?.max_score ?? NEW_ASSIGNMENT_MAX_SCORE}
            min={1}
            max={MAX_SCORE_LIMIT}
          />
        </Field>
      </div>

      <Field label="Условие" htmlFor={`${id}-description`}>
        <Textarea
          id={`${id}-description`}
          name="description"
          defaultValue={defaults?.description ?? ""}
          rows={4}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ссылка на материал" htmlFor={`${id}-material`}>
          <Input
            id={`${id}-material`}
            type="url"
            name="material_url"
            defaultValue={defaults?.material_url ?? ""}
            placeholder="https://…"
          />
        </Field>
        <Field label="Критерии оценивания" htmlFor={`${id}-criteria`}>
          <Input
            id={`${id}-criteria`}
            name="criteria"
            defaultValue={defaults?.criteria ?? ""}
          />
        </Field>
      </div>

      {attachedFiles}

      <Field label="Прикрепить файлы" htmlFor={`${id}-files`} hint="Можно выбрать несколько файлов">
        <Input id={`${id}-files`} type="file" name="files" multiple />
      </Field>
    </div>
  );
}
