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
import type { Course, User } from "../lib/types";

export default function Courses() {
  const { user, logout } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const load = useCallback(async () => {
    try {
      setCourses(await api<Course[]>("/api/courses"));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
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
      await api("/api/courses", {
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
      await api(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.get("name"),
          ...(user?.role === "admin"
            ? { teacher_id: teacherId ? Number(teacherId) : null }
            : {}),
        }),
      });
      setEditing(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Удалить дисциплину «${name}» со всеми темами и заданиями?`)) return;

    setError("");
    try {
      await api(`/api/courses/${id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout user={user} onLogout={logout} title="Дисциплины">
      {isStaff && (
        <Card title="Новая дисциплина">
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              name="name"
              placeholder="Название дисциплины"
              className="w-72"
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
      )}

      {error && <ErrorText>{error}</ErrorText>}

      <Card title={`Все дисциплины · ${courses.length}`} flush>
        {courses.length === 0 ? (
          <Empty>
            {isStaff ? "Пока нет ни одной дисциплины" : "Вам пока не назначены дисциплины"}
          </Empty>
        ) : (
          <ul className="divide-y divide-line">
            {courses.map((course) =>
              editing === course.id ? (
                <li key={course.id} className="px-5 py-3.5">
                  <form
                    onSubmit={(event) => void handleUpdate(event, course.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      type="text"
                      name="name"
                      defaultValue={course.name}
                      placeholder="Название дисциплины"
                      className="w-72"
                      required
                      autoFocus
                    />
                    {user?.role === "admin" && (
                      <Select name="teacher_id" defaultValue={course.teacher?.id ?? ""}>
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
                key={course.id}
                className="group flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
              >
                <Link
                  to={`/courses/${course.id}`}
                  className="w-64 truncate text-sm font-medium text-ink underline-offset-4 group-hover:underline"
                >
                  {course.name}
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
                  {course.teacher ? (
                    <>
                      Преподаватель:{" "}
                      <span className="font-medium text-ink">
                        {course.teacher.full_name ?? course.teacher.email}
                      </span>
                    </>
                  ) : (
                    "Преподаватель не назначен"
                  )}
                </span>
                <span className="w-40 truncate text-sm text-muted">
                  {course.groups.length > 0
                    ? course.groups.map((group) => group.name).join(", ")
                    : "Нет групп"}
                </span>
                {isStaff && (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(course.id)}
                      className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(course.id, course.name)}
                      className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                    >
                      Удалить
                    </button>
                  </>
                )}
              </li>
              ),
            )}
          </ul>
        )}
      </Card>
    </Layout>
  );
}
