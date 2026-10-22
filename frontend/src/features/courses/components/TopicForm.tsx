import { useState, type FormEvent } from "react";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ITopicFormProps {
  submitLabel: string;
  onSubmit: (title: string) => Promise<void>;
  defaultTitle?: string;
  onCancel?: () => void;
  shouldAutoFocus?: boolean;
  className?: string;
}

/** Тақырып атауының бір жолды формасы — қосу мен атын өзгертуге ортақ. */
export function TopicForm({
  submitLabel,
  onSubmit,
  defaultTitle,
  onCancel,
  shouldAutoFocus = false,
  className,
}: ITopicFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = String(new FormData(form).get("title") ?? "");

    setError("");
    setIsSaving(true);
    try {
      await onSubmit(title);
      form.reset();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          name="title"
          defaultValue={defaultTitle}
          placeholder="Название темы"
          aria-label="Название темы"
          className="min-w-48 flex-1 sm:max-w-sm"
          required
          autoFocus={shouldAutoFocus}
        />
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Отмена
          </Button>
        )}
      </div>
      <FormError message={error} />
    </form>
  );
}
