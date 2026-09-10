import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "./Button";
import { Card } from "./Card";
import { ErrorText } from "./ErrorText";
import { Input } from "./Input";
import { StatusBadge } from "./StatusBadge";
import { Textarea } from "./Textarea";
import { api, apiForm, download } from "../lib/api";
import { formatDate } from "../lib/date";
import type { Submission } from "../lib/types";

export function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} КБ`
    : `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

export function MyWork({ assignmentId }: { assignmentId: number }) {
  const [work, setWork] = useState<Submission | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setWork(await api<Submission | null>(`/api/assignments/${assignmentId}/submission`));
  }, [assignmentId]);

  useEffect(() => {
    void load().catch(() => setWork(null));
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    setLoading(true);
    try {
      setWork(
        await apiForm<Submission>(
          `/api/assignments/${assignmentId}/submit`,
          new FormData(form),
        ),
      );
      form.reset();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const last = work?.versions.at(-1);

  return (
    <Card title="Моя работа" action={<StatusBadge status={work?.status ?? null} />}>
      <div className="space-y-4">
        {work?.comment && (
          <div
            className={`rounded-xl border p-4 ${
              work.status === "revision"
                ? "border-red-200 bg-red-50"
                : "border-line bg-canvas"
            }`}
          >
            <p className="text-sm text-muted">Комментарий преподавателя</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{work.comment}</p>
            {work.score !== null && (
              <p className="mt-2 text-sm text-ink">
                Оценка: <span className="font-bold">{work.score}</span>
              </p>
            )}
          </div>
        )}

        {work && work.versions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Попыток: {work.versions.length} · последняя{" "}
              {formatDate(last?.submitted_at ?? null)}
            </p>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {[...work.versions].reverse().map((version, index) => (
                <li key={version.id} className="space-y-2 px-4 py-3">
                  <p className="text-sm text-muted">
                    Попытка {work.versions.length - index} ·{" "}
                    {formatDate(version.submitted_at)}
                  </p>
                  {version.text && (
                    <p className="whitespace-pre-line text-sm text-ink">
                      {version.text}
                    </p>
                  )}
                  {version.link && (
                    <a
                      href={version.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm text-ink underline underline-offset-2"
                    >
                      {version.link}
                    </a>
                  )}
                  {version.files.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => void download(`/api/files/${file.id}`, file.filename)}
                      className="block text-sm text-ink underline underline-offset-2 transition-colors duration-150 hover:text-muted"
                    >
                      {file.filename} · {formatSize(file.size)}
                    </button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            name="text"
            placeholder="Ответ прямо на сайте (необязательно)"
            rows={3}
            className="w-full"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="url"
              name="link"
              placeholder="Ссылка на Google Drive, YouTube…"
              className="w-72"
            />
            <input
              type="file"
              name="files"
              multiple
              className="max-w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink hover:file:border-ink"
            />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Отправка…"
              : work
                ? "Отправить повторно"
                : "Сдать работу"}
          </Button>
        </form>
      </div>
    </Card>
  );
}
