import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "../components/Button";
import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { Select } from "../components/Select";
import { Textarea } from "../components/Textarea";
import { api, uploadAssignmentFiles } from "../lib/api";
import { formatDate, fromLocalInput, isOverdue } from "../lib/date";
import { useSession } from "../lib/session";
import type { CourseDetail as CourseDetailType, Group, User } from "../lib/types";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [course, setCourse] = useState<CourseDetailType | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [editingTopic, setEditingTopic] = useState<number | null>(null);
  const [error, setError] = useState("");

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const load = useCallback(async () => {
    try {
      setCourse(await api<CourseDetailType>(`/api/courses/${id}`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [id]);

  useEffect(() => {
    if (!user) return;
    void load();
    if (user.role === "admin" || user.role === "teacher") {
      api<Group[]>("/api/groups")
        .then(setGroups)
        .catch(() => setGroups([]));
    }
    if (user.role === "admin") {
      api<User[]>("/api/users")
        .then((all) => setTeachers(all.filter((item) => item.role === "teacher")))
        .catch(() => setTeachers([]));
    }
  }, [user, load]);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const teacherId = data.get("teacher_id");

    setError("");
    try {
      setCourse(
        await api<CourseDetailType>(`/api/courses/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.get("name"),
            description: data.get("description") || null,
            group_ids: data.getAll("group_ids").map(Number),
            ...(user?.role === "admin"
              ? { teacher_id: teacherId ? Number(teacherId) : null }
              : {}),
          }),
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDeleteCourse() {
    if (!course || !confirm(`Удалить дисциплину «${course.name}»?`)) return;

    try {
      await api(`/api/courses/${id}`, { method: "DELETE" });
      navigate("/courses", { replace: true });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleAddTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    setError("");
    try {
      await api(`/api/courses/${id}/topics`, {
        method: "POST",
        body: JSON.stringify({ title: new FormData(form).get("title") }),
      });
      form.reset();
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleAddTest(topicId: number) {
    const title = prompt("Название теста");
    if (!title) return;

    setError("");
    try {
      const test = await api<{ id: number }>(`/api/topics/${topicId}/tests`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      navigate(`/tests/${test.id}/edit`);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleRenameTopic(event: FormEvent<HTMLFormElement>, topicId: number) {
    event.preventDefault();
    const title = new FormData(event.currentTarget).get("title");

    setError("");
    try {
      await api(`/api/topics/${topicId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      setEditingTopic(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDeleteTopic(topicId: number, title: string) {
    if (!confirm(`Удалить тему «${title}» со всеми заданиями?`)) return;

    setError("");
    try {
      await api(`/api/topics/${topicId}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleAddAssignment(event: FormEvent<HTMLFormElement>, topicId: number) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    try {
      const created = await api<{ id: number }>(
        `/api/topics/${topicId}/assignments`,
        {
          method: "POST",
          body: JSON.stringify({
            title: data.get("title"),
            description: data.get("description") || null,
            material_url: data.get("material_url") || null,
            criteria: data.get("criteria") || null,
            due_at: fromLocalInput(String(data.get("due_at") ?? "")),
            max_score: Number(data.get("max_score")) || 100,
          }),
        },
      );
      await uploadAssignmentFiles(created.id, data);
      setAddingTo(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={course?.name ?? "Дисциплина"}
      subtitle={
        course
          ? `${
              course.teacher
                ? `Преподаватель: ${course.teacher.full_name ?? course.teacher.email}`
                : "Преподаватель не назначен"
            } · ${course.groups.map((group) => group.name).join(", ") || "нет групп"}`
          : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-4">
        <Link
          to="/courses"
          className="text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          ← Дисциплины
        </Link>
        {isStaff && (
          <Link
            to={`/courses/${id}/gradebook`}
            className="ml-auto rounded-xl border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink"
          >
            Журнал оценок
          </Link>
        )}
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {course && (
        <>
          {isStaff && (
            <Card title="Настройки">
              <form onSubmit={handleSave} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="text"
                    name="name"
                    defaultValue={course.name}
                    placeholder="Название"
                    className="w-72"
                    required
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
                </div>

                <Textarea
                  name="description"
                  defaultValue={course.description ?? ""}
                  placeholder="Описание дисциплины"
                  rows={2}
                  className="w-full"
                />

                <div>
                  <p className="mb-2 text-sm text-muted">Группы</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {groups.length === 0 && (
                      <span className="text-sm text-muted">Групп пока нет</span>
                    )}
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center gap-2 text-sm text-ink"
                      >
                        <input
                          type="checkbox"
                          name="group_ids"
                          value={group.id}
                          defaultChecked={course.groups.some(
                            (item) => item.id === group.id,
                          )}
                          className="size-4 accent-ink"
                        />
                        {group.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit">Сохранить</Button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCourse()}
                    className="ml-auto text-sm text-muted transition-colors duration-150 hover:text-red-600"
                  >
                    Удалить дисциплину
                  </button>
                </div>
              </form>
            </Card>
          )}

          <Card title={`Темы · ${course.topics.length}`} flush>
            {isStaff && (
              <form
                onSubmit={handleAddTopic}
                className="flex flex-wrap items-center gap-2 border-b border-line px-5 pb-5"
              >
                <Input
                  type="text"
                  name="title"
                  placeholder="Название темы"
                  className="w-72"
                  required
                />
                <Button type="submit">Добавить тему</Button>
              </form>
            )}

            {course.topics.length === 0 ? (
              <Empty>В дисциплине пока нет тем</Empty>
            ) : (
              <div className="divide-y divide-line">
                {course.topics.map((topic) => (
                  <div key={topic.id}>
                    <div className="flex items-center gap-3 px-5 py-3.5">
                      {editingTopic === topic.id ? (
                        <form
                          onSubmit={(event) => void handleRenameTopic(event, topic.id)}
                          className="flex flex-1 flex-wrap items-center gap-2"
                        >
                          <Input
                            type="text"
                            name="title"
                            defaultValue={topic.title}
                            placeholder="Название темы"
                            className="w-72"
                            required
                            autoFocus
                          />
                          <Button type="submit">Сохранить</Button>
                          <button
                            type="button"
                            onClick={() => setEditingTopic(null)}
                            className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                          >
                            Отмена
                          </button>
                        </form>
                      ) : (
                        <span className="flex-1 truncate text-sm font-medium text-ink">
                          Тема {topic.position}. {topic.title}
                        </span>
                      )}
                      {isStaff && editingTopic !== topic.id && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingTopic(topic.id)}
                            className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                          >
                            Изменить
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setAddingTo(addingTo === topic.id ? null : topic.id)
                            }
                            className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                          >
                            {addingTo === topic.id ? "Отмена" : "Добавить задание"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAddTest(topic.id)}
                            className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                          >
                            Добавить тест
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteTopic(topic.id, topic.title)}
                            className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>

                    {addingTo === topic.id && (
                      <form
                        onSubmit={(event) => void handleAddAssignment(event, topic.id)}
                        className="space-y-3 bg-canvas px-5 py-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="text"
                            name="title"
                            placeholder="Название задания"
                            className="w-72"
                            required
                            autoFocus
                          />
                          <Input
                            type="datetime-local"
                            name="due_at"
                            className="w-56"
                            title="Срок сдачи"
                          />
                          <Input
                            type="number"
                            name="max_score"
                            defaultValue={20}
                            min={1}
                            max={1000}
                            className="w-28"
                            title="Максимальный балл"
                          />
                        </div>
                        <Textarea
                          name="description"
                          placeholder="Условие задания"
                          rows={3}
                          className="w-full"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="url"
                            name="material_url"
                            placeholder="Ссылка на материал"
                            className="w-72"
                          />
                          <Input
                            type="text"
                            name="criteria"
                            placeholder="Критерии оценивания"
                            className="w-72"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="file"
                            name="files"
                            multiple
                            className="max-w-full text-sm text-muted file:mr-3 file:rounded-lg file:border file:border-line file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-ink hover:file:border-ink"
                          />
                          <Button type="submit">Создать задание</Button>
                        </div>
                      </form>
                    )}

                    {topic.tests.length > 0 && (
                      <ul className="divide-y divide-line border-t border-line">
                        {topic.tests.map((test) => (
                          <li
                            key={test.id}
                            className="flex items-center gap-3 px-5 py-3 pl-8 transition-colors duration-150 hover:bg-canvas"
                          >
                            <Link
                              to={isStaff ? `/tests/${test.id}/edit` : `/tests/${test.id}`}
                              className="flex-1 truncate text-sm text-ink transition-colors duration-150 hover:text-muted"
                            >
                              Тест: {test.title}
                            </Link>
                            <span className="text-sm text-muted">
                              {test.time_limit_minutes
                                ? `${test.time_limit_minutes} мин`
                                : "без таймера"}{" "}
                              · попыток: {test.attempts_allowed}
                            </span>
                            <span className="w-40 text-right text-sm text-muted">
                              {formatDate(test.due_at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {topic.assignments.length > 0 && (
                      <ul className="divide-y divide-line border-t border-line">
                        {topic.assignments.map((assignment) => (
                          <li
                            key={assignment.id}
                            className="flex items-center gap-3 px-5 py-3 pl-8 transition-colors duration-150 hover:bg-canvas"
                          >
                            <Link
                              to={`/assignments/${assignment.id}`}
                              className="flex-1 truncate text-sm text-ink transition-colors duration-150 hover:text-muted"
                            >
                              {assignment.title}
                            </Link>
                            <span
                              className={`text-sm ${
                                isOverdue(assignment.due_at)
                                  ? "text-red-600"
                                  : "text-muted"
                              }`}
                            >
                              {formatDate(assignment.due_at)}
                            </span>
                            <span className="w-20 text-right text-sm text-muted">
                              {assignment.max_score} б.
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </Layout>
  );
}
