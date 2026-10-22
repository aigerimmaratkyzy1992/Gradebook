import { MessageSquareText, Send } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { apiForm, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { ISubmission } from "@/types";

import { useMySubmission } from "../hooks/useMySubmission";
import { SubmissionVersions } from "./SubmissionVersions";

interface IMyWorkProps {
  assignmentId: number;
}

/** Студенттің жұмысы: преподаватель пікірі, тапсыру тарихы және жаңа нұсқа формасы. */
export function MyWork({ assignmentId }: IMyWorkProps) {
  const id = useId();
  const { work, setWork, isLoading } = useMySubmission(assignmentId);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setIsSending(true);
    try {
      setWork(
        await apiForm<ISubmission>(`/api/assignments/${assignmentId}/submit`, new FormData(form)),
      );
      form.reset();
      toast.success("Работа отправлена");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSending(false);
    }
  }

  const lastVersion = work?.versions.at(-1);
  const hasFeedback = Boolean(work?.comment) || (work !== null && work.score !== null);
  const isRevision = work?.status === "revision";
  const summary = lastVersion
    ? `Попыток: ${work?.versions.length} · последняя ${formatDate(lastVersion.submitted_at)}`
    : "Напишите ответ, добавьте ссылку или прикрепите файлы";

  return (
    <Card>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>Моя работа</CardTitle>
          <CardDescription>{summary}</CardDescription>
        </div>
        <CardAction>
          <StatusBadge status={work?.status ?? null} />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <Skeleton className="h-20 rounded-lg" />
        ) : (
          <>
            {work && hasFeedback && (
              <div
                className={cn(
                  "rounded-lg border p-4",
                  isRevision ? "border-destructive/30 bg-destructive/10" : "border-border bg-muted/50",
                )}
              >
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MessageSquareText className="size-4" aria-hidden />
                  Комментарий преподавателя
                </p>
                {work.comment && (
                  <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{work.comment}</p>
                )}
                {work.score !== null && (
                  <p className="mt-2 text-sm">
                    Оценка: <span className="font-semibold tabular-nums">{work.score}</span>
                  </p>
                )}
              </div>
            )}

            {work && work.versions.length > 0 && <SubmissionVersions versions={work.versions} />}
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Ответ" htmlFor={`${id}-text`} hint="Необязательно">
            <Textarea
              id={`${id}-text`}
              name="text"
              rows={3}
              placeholder="Ответ прямо на сайте"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ссылка" htmlFor={`${id}-link`}>
              <Input
                id={`${id}-link`}
                type="url"
                name="link"
                placeholder="Google Drive, YouTube…"
              />
            </Field>
            <Field label="Файлы" htmlFor={`${id}-files`}>
              <Input id={`${id}-files`} type="file" name="files" multiple />
            </Field>
          </div>
          <FormError message={error} />
          <Button type="submit" isLoading={isSending}>
            {!isSending && <Send aria-hidden />}
            {work ? "Отправить повторно" : "Сдать работу"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
