import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { Button } from "../components/Button";
import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { Select } from "../components/Select";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import type { Group, User } from "../lib/types";

export default function Groups() {
  const { user, logout } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroups(await api<Group[]>("/api/groups"));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    // Преподаватель тізімі тек admin-ге қолжетімді.
    if (user.role === "admin") {
      api<User[]>("/api/users")
        .then((all) => setTeachers(all.filter((item) => item.role === "teacher")))
        .catch(() => setTeachers([]));
    }
  }, [user, load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const teacherId = data.get("teacher_id");

    setError("");
    setLoading(true);
    try {
      await api("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          teacher_id: teacherId ? Number(teacherId) : null,
        }),
      });
      form.reset();
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const teacherId = data.get("teacher_id");

    setError("");
    try {
      await api(`/api/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.get("name"),
          teacher_id: teacherId ? Number(teacherId) : null,
        }),
      });
      setEditing(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Удалить группу «${name}»?`)) return;

    setError("");
    try {
      await api(`/api/groups/${id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout user={user} onLogout={logout} title="Группы">
      <Card title="Новая группа">
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
          <Input
            type="text"
            name="name"
            placeholder="Название"
            className="w-48"
            required
          />
          {user?.role === "admin" && (
            <Select name="teacher_id" defaultValue="">
              <option value="">Без преподавателя</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name ?? teacher.email}
                </option>
              ))}
            </Select>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? "Создание…" : "Создать"}
          </Button>
        </form>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}

      <Card title={`Все группы · ${groups.length}`} flush>
        {groups.length === 0 ? (
          <Empty>Пока нет ни одной группы</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {groups.map((group) =>
              editing === group.id ? (
                <li key={group.id} className="px-5 py-3.5">
                  <form
                    onSubmit={(event) => void handleUpdate(event, group.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      type="text"
                      name="name"
                      defaultValue={group.name}
                      placeholder="Название"
                      className="w-48"
                      required
                      autoFocus
                    />
                    {user?.role === "admin" && (
                      <Select name="teacher_id" defaultValue={group.teacher?.id ?? ""}>
                        <option value="">Без преподавателя</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name ?? teacher.email}
                          </option>
                        ))}
                      </Select>
                    )}
                    <Button type="submit">Сохранить</Button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                    >
                      Отмена
                    </button>
                  </form>
                </li>
              ) : (
                <li
                  key={group.id}
                  className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
                >
                  <Link
                    to={`/groups/${group.id}`}
                    className="w-44 truncate text-sm font-medium text-ink underline-offset-4 group-hover:underline"
                  >
                    {group.name}
                  </Link>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-4 shrink-0 text-line transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:text-ink"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                  <span className="flex-1 truncate text-sm text-muted">
                    {group.teacher ? (
                      <>
                        Преподаватель:{" "}
                        <span className="font-medium text-ink">
                          {group.teacher.full_name ?? group.teacher.email}
                        </span>
                      </>
                    ) : (
                      "Преподаватель не назначен"
                    )}
                  </span>
                  <span className="text-sm text-muted">
                    {group.students_count} студ.
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(group.id)}
                    className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(group.id, group.name)}
                    className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </Card>
    </Layout>
  );
}
