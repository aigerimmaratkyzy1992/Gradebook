import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "./Button";
import { Card, Empty } from "./Card";
import { ErrorText } from "./ErrorText";
import { Input } from "./Input";
import { StatusBadge } from "./StatusBadge";
import { Textarea } from "./Textarea";
import { api, download } from "../lib/api";
import { formatDate } from "../lib/date";
import type { StudentWork } from "../lib/types";

type Props = {
  assignmentId: number;
  maxScore: number;
};

export function WorkReview({ assignmentId, maxScore }: Props) {
  const [rows, setRows] = useState<StudentWork[]>([]);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setRows(await api<StudentWork[]>(`/api/assignments/${assignmentId}/submissions`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReview(
    event: FormEvent<HTMLFormElement>,
    submissionId: number,
    sendBack: boolean,
  ) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const score = String(data.get("score") ?? "");

    setError("");
    try {
      await api(`/api/assignments/submissions/${submissionId}/review`, {
        method: "POST",
        body: JSON.stringify({
          score: score === "" ? null : Number(score),
          comment: data.get("comment") || null,
          send_back: sendBack,
        }),
      });
      setReviewing(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  const submitted = rows.filter((row) => row.submission).length;

  return (
    <Card title={`Работы студентов · ${submitted} из ${rows.length}`} flush>
      {error && (
        <div className="px-5 pb-3">
          <ErrorText>{error}</ErrorText>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty>В группах дисциплины пока нет студентов</Empty>
      ) : (
        <div className="divide-y divide-line">
          <div className="flex items-center gap-3 px-5 py-2.5 text-xs text-muted">
            <span className="w-48">Студент</span>
            <span className="flex-1">Работа</span>
            <span className="w-40">Сдано</span>
            <span className="w-16 text-right">Балл</span>
            <span className="w-32 text-center">Статус</span>
            <span className="w-20" />
          </div>

          {rows.map(({ student, submission }) => {
            const last = submission?.versions.at(-1);
            return (
              <div key={student.id}>
                <div className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas">
                  <span className="w-48 truncate text-sm font-medium text-ink">
                    {student.full_name ?? student.email}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {!submission && <span className="text-sm text-muted">—</span>}
                    {last?.files.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() =>
                          void download(`/api/files/${file.id}`, file.filename)
                        }
                        className="max-w-52 truncate text-sm text-ink underline underline-offset-2 transition-colors duration-150 hover:text-muted"
                      >
                        {file.filename}
                      </button>
                    ))}
                    {last?.link && (
                      <a
                        href={last.link}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-52 truncate text-sm text-ink underline underline-offset-2"
                      >
                        ссылка
                      </a>
                    )}
                    {last?.text && !last.files.length && !last.link && (
                      <span className="truncate text-sm text-muted">текстовый ответ</span>
                    )}
                    {submission && submission.versions.length > 1 && (
                      <span className="text-xs text-muted">
                        ({submission.versions.length} попытки)
                      </span>
                    )}
                  </span>

                  <span className="w-40 truncate text-sm text-muted">
                    {last ? formatDate(last.submitted_at) : "—"}
                  </span>
                  <span className="w-16 text-right text-sm font-medium text-ink">
                    {submission?.score ?? "—"}
                    {submission?.score !== null && submission?.score !== undefined && (
                      <span className="text-muted">/{maxScore}</span>
                    )}
                  </span>
                  <span className="w-32 text-center">
                    <StatusBadge status={submission?.status ?? null} />
                  </span>
                  <span className="w-20 text-right">
                    {submission && (
                      <button
                        type="button"
                        onClick={() =>
                          setReviewing(
                            reviewing === submission.id ? null : submission.id,
                          )
                        }
                        className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                      >
                        {reviewing === submission.id ? "Отмена" : "Проверить"}
                      </button>
                    )}
                  </span>
                </div>

                {submission && reviewing === submission.id && (
                  <form
                    onSubmit={(event) =>
                      void handleReview(event, submission.id, false)
                    }
                    className="space-y-3 bg-canvas px-5 py-4"
                  >
                    {last?.text && (
                      <p className="whitespace-pre-line rounded-xl border border-line bg-surface p-4 text-sm text-ink">
                        {last.text}
                      </p>
                    )}
                    <Textarea
                      name="comment"
                      defaultValue={submission.comment ?? ""}
                      placeholder="Комментарий студенту"
                      rows={2}
                      className="w-full"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="number"
                        name="score"
                        defaultValue={submission.score ?? ""}
                        min={0}
                        max={maxScore}
                        placeholder="Балл"
                        className="w-28"
                      />
                      <span className="text-sm text-muted">из {maxScore}</span>
                      <Button type="submit">Проверено</Button>
                      <button
                        type="submit"
                        formNoValidate
                        onClick={(event) => {
                          const form = event.currentTarget.form;
                          if (!form) return;
                          event.preventDefault();
                          void handleReview(
                            {
                              preventDefault: () => {},
                              currentTarget: form,
                            } as unknown as FormEvent<HTMLFormElement>,
                            submission.id,
                            true,
                          );
                        }}
                        className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-red-500 hover:text-red-600"
                      >
                        На доработку
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
