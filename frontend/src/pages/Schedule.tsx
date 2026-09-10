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
import type { Course, Group, Lesson } from "../lib/types";

const WEEKDAYS = [
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
  "Воскресенье",
];

export default function Schedule() {
  const { user, logout } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [courseId, setCourseId] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const load = useCallback(async () => {
    try {
      setLessons(await api<Lesson[]>("/api/schedule"));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    if (user.role === "admin" || user.role === "teacher") {
      api<Course[]>("/api/courses")
        .then((items) => {
          setCourses(items);
          setCourseId((current) => current || String(items[0]?.id ?? ""));
        })
        .catch(() => setCourses([]));
      api<Group[]>("/api/groups")
        .then(setGroups)
        .catch(() => setGroups([]));
    }
  }, [user, load]);

  // Топты дисциплина бойынша шектейміз — backend те соны талап етеді.
  const selected = courses.find((course) => String(course.id) === courseId);
  const availableGroups = selected
    ? groups.filter((group) => selected.groups.some((item) => item.id === group.id))
    : [];

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setError("");
    try {
      await api("/api/schedule", {
        method: "POST",
        body: JSON.stringify({
          course_id: Number(data.get("course_id")),
          group_id: Number(data.get("group_id")),
          weekday: Number(data.get("weekday")),
          starts_at: data.get("starts_at"),
          ends_at: data.get("ends_at"),
          room: data.get("room") || null,
        }),
      });
      form.reset();
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    try {
      await api(`/api/schedule/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          group_id: Number(data.get("group_id")),
          weekday: Number(data.get("weekday")),
          starts_at: data.get("starts_at"),
          ends_at: data.get("ends_at"),
          room: data.get("room") || null,
        }),
      });
      setEditing(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Удалить занятие из расписания?")) return;

    try {
      await api(`/api/schedule/${id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout user={user} onLogout={logout} title="Расписание">
      {isStaff && (
        <Card title="Новое занятие">
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
            <Select
              name="course_id"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              required
            >
              {courses.length === 0 && <option value="">Нет дисциплин</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </Select>
            <Select name="group_id" required>
              {availableGroups.length === 0 && (
                <option value="">Нет групп у дисциплины</option>
              )}
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>
            <Select name="weekday" defaultValue="0">
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </Select>
            <Input type="time" name="starts_at" className="w-32" required />
            <Input type="time" name="ends_at" className="w-32" required />
            <Input type="text" name="room" placeholder="Аудитория" className="w-36" />
              <Button type="submit" disabled={availableGroups.length === 0}>
                Добавить
              </Button>
            </div>

            {selected && availableGroups.length === 0 && (
              <p className="text-sm text-muted">
                У дисциплины «{selected.name}» нет групп. Прикрепите её к группе в{" "}
                <Link
                  to={`/courses/${selected.id}`}
                  className="font-medium text-ink underline underline-offset-2"
                >
                  настройках дисциплины
                </Link>
                {" "}— после этого группа появится в списке.
              </p>
            )}
          </form>
        </Card>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {lessons.length === 0 ? (
        <Card title="Занятия" flush>
          <Empty>Расписание пока пустое</Empty>
        </Card>
      ) : (
        WEEKDAYS.map((day, index) => {
          const items = lessons.filter((lesson) => lesson.weekday === index);
          if (items.length === 0) return null;

          return (
            <Card key={day} title={day} flush>
              <ul className="divide-y divide-line">
                {items.map((lesson) =>
                  editing === lesson.id ? (
                    <li key={lesson.id} className="px-5 py-3.5">
                      <form
                        onSubmit={(event) => void handleUpdate(event, lesson.id)}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span className="text-sm text-muted">{lesson.course.name}</span>
                        <Select
                          name="group_id"
                          defaultValue={lesson.group.id}
                          required
                        >
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </Select>
                        <Select name="weekday" defaultValue={lesson.weekday}>
                          {WEEKDAYS.map((day, dayIndex) => (
                            <option key={day} value={dayIndex}>
                              {day}
                            </option>
                          ))}
                        </Select>
                        <Input
                          type="time"
                          name="starts_at"
                          defaultValue={lesson.starts_at.slice(0, 5)}
                          className="w-32"
                          required
                        />
                        <Input
                          type="time"
                          name="ends_at"
                          defaultValue={lesson.ends_at.slice(0, 5)}
                          className="w-32"
                          required
                        />
                        <Input
                          type="text"
                          name="room"
                          defaultValue={lesson.room ?? ""}
                          placeholder="Аудитория"
                          className="w-36"
                        />
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
                    key={lesson.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
                  >
                    <span className="w-32 text-sm font-medium text-ink">
                      {lesson.starts_at.slice(0, 5)} — {lesson.ends_at.slice(0, 5)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">
                      {lesson.course.name}
                    </span>
                    <span className="w-32 truncate text-sm text-muted">
                      {lesson.group.name}
                    </span>
                    <span className="w-28 truncate text-sm text-muted">
                      {lesson.room ?? "—"}
                    </span>
                    {isStaff && (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditing(lesson.id)}
                          className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                        >
                          Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(lesson.id)}
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
            </Card>
          );
        })
      )}
    </Layout>
  );
}
