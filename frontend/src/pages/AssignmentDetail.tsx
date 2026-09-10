import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { MyWork, formatSize } from "../components/MyWork";
import { WorkReview } from "../components/WorkReview";
import { Textarea } from "../components/Textarea";
import { api, download, uploadAssignmentFiles } from "../lib/api";
import { formatDate, fromLocalInput, isOverdue, toLocalInput } from "../lib/date";
import { useSession } from "../lib/session";
import type { AssignmentDetail } from "../lib/types";

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const load = useCallback(async () => {
    try {
      setAssignment(await api<AssignmentDetail>(`/api/assignments/${id}`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [id]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    try {
      await api(`/api/assignments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description") || null,
          material_url: data.get("material_url") || null,
          criteria: data.get("criteria") || null,
          due_at: fromLocalInput(String(data.get("due_at") ?? "")),
          max_score: Number(data.get("max_score")) || 100,
        }),
      });
      await uploadAssignmentFiles(Number(id), data);
      setEditing(false);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDeleteFile(fileId: number, filename: string) {
    if (!confirm(`Удалить файл «${filename}»?`)) return;

    setError("");
    try {
      await api(`/api/assignments/files/${fileId}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDelete() {
    if (!assignment || !confirm(`Удалить задание «${assignment.title}»?`)) return;

    try {
      await api(`/api/assignments/${id}`, { method: "DELETE" });
      navigate(`/courses/${assignment.course_id}`, { replace: true });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={assignment?.title ?? "Задание"}
      subtitle={
        assignment
          ? `${assignment.course_name} · Тема: ${assignment.topic_title}`
          : undefined
      }
    >
      {assignment && (
        <Link
          to={`/courses/${assignment.course_id}`}
          className="inline-block text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          ← {assignment.course_name}
        </Link>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {assignment && !editing && (
        <Card
          title="Условие"
          action={
            isStaff ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                >
                  Изменить
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                >
                  Удалить
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <p className="whitespace-pre-line text-sm text-ink">
              {assignment.description ?? "Условие не указано"}
            </p>

            <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-muted">Срок сдачи:</dt>
                <dd
                  className={
                    isOverdue(assignment.due_at)
                      ? "font-medium text-red-600"
                      : "font-medium text-ink"
                  }
                >
                  {formatDate(assignment.due_at)}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-muted">Максимальный балл:</dt>
                <dd className="font-medium text-ink">{assignment.max_score}</dd>
              </div>
              {assignment.criteria && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="shrink-0 text-muted">Критерии:</dt>
                  <dd className="text-ink">{assignment.criteria}</dd>
                </div>
              )}
              {assignment.files.length > 0 && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="shrink-0 text-muted">Файлы:</dt>
                  <dd className="min-w-0 space-y-1">
                    {assignment.files.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() =>
                          void download(
                            `/api/assignments/files/${file.id}`,
                            file.filename,
                          )
                        }
                        className="block max-w-full truncate text-sm font-medium text-ink underline underline-offset-2 transition-colors duration-150 hover:text-muted"
                      >
                        {file.filename} · {formatSize(file.size)}
                      </button>
                    ))}
                  </dd>
                </div>
              )}
              {assignment.material_url && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="shrink-0 text-muted">Материал:</dt>
                  <dd className="min-w-0">
                    <a
                      href={assignment.material_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate font-medium text-ink underline underline-offset-2"
                    >
                      {assignment.material_url}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </Card>
      )}

      {assignment && !editing && user?.role === "student" && (
        <MyWork assignmentId={assignment.id} />
      )}

      {assignment && !editing && isStaff && (
        <WorkReview assignmentId={assignment.id} maxScore={assignment.max_score} />
      )}

      {assignment && editing && (
        <Card title="Редактирование задания">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="text"
                name="title"
                defaultValue={assignment.title}
                placeholder="Название"
                className="w-72"
                required
              />
              <Input
                type="datetime-local"
                name="due_at"
                defaultValue={toLocalInput(assignment.due_at)}
                className="w-56"
              />
              <Input
                type="number"
                name="max_score"
                defaultValue={assignment.max_score}
                min={1}
                max={1000}
                className="w-28"
              />
            </div>
            <Textarea
              name="description"
              defaultValue={assignment.description ?? ""}
              placeholder="Условие задания"
              rows={4}
              className="w-full"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="url"
                name="material_url"
                defaultValue={assignment.material_url ?? ""}
                placeholder="Ссылка на материал"
                className="w-72"
              />
              <Input
                type="text"
                name="criteria"
                defaultValue={assignment.criteria ?? ""}
                placeholder="Критерии оценивания"
                className="w-72"
              />
            </div>
            {assignment.files.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {assignment.files.map((file) => (
                  <li key={file.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="flex-1 truncate text-sm text-ink">
                      {file.filename} · {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleDeleteFile(file.id, file.filename)}
                      className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              type="file"
              name="files"
              multiple
              className="max-w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink hover:file:border-ink"
            />
            <div className="flex items-center gap-3">
              <Button type="submit">Сохранить</Button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-muted transition-colors duration-150 hover:text-ink"
              >
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}
    </Layout>
  );
}
