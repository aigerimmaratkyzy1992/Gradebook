import { useId, useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Textarea } from "@/components/ui/Textarea";
import { KIND_LABELS } from "@/constants/labels";
import { getErrorMessage } from "@/lib/api";
import type { IQuestion, QuestionKind } from "@/types";

import { QUESTION_KINDS } from "../constants";
import type { IQuestionPayload } from "../types";
import { buildQuestionPayload } from "../utils";

import { QuestionOptionFields } from "./QuestionOptionFields";

type QuestionDraft = Pick<IQuestion, "kind" | "text" | "points" | "options">;

interface IQuestionEditorProps {
  /** Берілсе — өңдеу режимі (түрін өзгертуге болмайды), әйтпесе — жаңа сұрақ. */
  question?: QuestionDraft;
  submitLabel: string;
  onSubmit: (payload: IQuestionPayload) => Promise<void>;
  onCancel?: () => void;
}

export function QuestionEditor({ question, submitLabel, onSubmit, onCancel }: IQuestionEditorProps) {
  const formId = useId();
  const [kind, setKind] = useState<QuestionKind>(question?.kind ?? "single");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isEditing = Boolean(question);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = buildQuestionPayload(kind, new FormData(form));

    setError("");
    setIsSaving(true);
    try {
      await onSubmit(payload);
      if (!isEditing) form.reset();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        {isEditing ? (
          <div className="grid gap-2">
            <span className="text-[13px] leading-none font-medium">Тип вопроса</span>
            <p className="flex h-10 items-center text-sm text-muted-foreground">
              {KIND_LABELS[kind]}
            </p>
          </div>
        ) : (
          <Field label="Тип вопроса" htmlFor={`${formId}-kind`}>
            <NativeSelect
              id={`${formId}-kind`}
              value={kind}
              onChange={(event) => setKind(event.target.value as QuestionKind)}
            >
              {QUESTION_KINDS.map((item) => (
                <option key={item} value={item}>
                  {KIND_LABELS[item]}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field label="Баллы" htmlFor={`${formId}-points`}>
          <Input
            id={`${formId}-points`}
            type="number"
            name="points"
            defaultValue={question?.points ?? 1}
            min={1}
            max={100}
          />
        </Field>
      </div>

      <Field label="Текст вопроса" htmlFor={`${formId}-text`}>
        <Textarea
          id={`${formId}-text`}
          name="text"
          defaultValue={question?.text ?? ""}
          rows={2}
          required
        />
      </Field>

      {/* key: түр ауысқанда ескі нұсқа өрістері қалып қоймауы үшін. */}
      <QuestionOptionFields
        key={kind}
        kind={kind}
        idPrefix={formId}
        options={question?.options ?? []}
      />

      <FormError message={error} />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Отмена
          </Button>
        )}
      </div>
    </form>
  );
}
