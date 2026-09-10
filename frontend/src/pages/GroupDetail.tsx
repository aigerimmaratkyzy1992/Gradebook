import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { Button } from "../components/Button";
import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Layout } from "../components/Layout";
import { Input } from "../components/Input";
import { Select } from "../components/Select";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import type { GroupDetail as GroupDetailType, User } from "../lib/types";

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useSession();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setGroup(await api<GroupDetailType>(`/api/groups/${id}`));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [id]);

  const loadStudents = useCallback(async () => {
    setStudents(await api<User[]>("/api/users?role=student").catch(() => []));
  }, []);

  useEffect(() => {
    if (!user) return;
    void load();
    void loadStudents();
    if (user.role === "admin") {
      api<User[]>("/api/users")
        .then((all) => setTeachers(all.filter((item) => item.role === "teacher")))
        .catch(() => setTeachers([]));
    }
  }, [user, load, loadStudents]);

  // Топта жоқ студенттер ғана таңдауға шығады.
  const available = students.filter(
    (student) => !group?.students.some((member) => member.id === student.id),
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const teacherId = data.get("teacher_id");

    setError("");
    try {
      setGroup(
        await api<GroupDetailType>(`/api/groups/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: data.get("name"),
            teacher_id: teacherId ? Number(teacherId) : null,
          }),
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleAddStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email");
    if (!email) return;

    setError("");
    setLoading(true);
    try {
      setGroup(
        await api<GroupDetailType>(`/api/groups/${id}/students`, {
          method: "POST",
          body: JSON.stringify({ email }),
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteGroup() {
    if (!group || !confirm(`Удалить группу «${group.name}»?`)) return;

    try {
      await api(`/api/groups/${id}`, { method: "DELETE" });
      navigate("/groups", { replace: true });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleRemoveStudent(studentId: number, email: string) {
    if (!confirm(`Убрать ${email} из группы?`)) return;

    setError("");
    try {
      setGroup(
        await api<GroupDetailType>(`/api/groups/${id}/students/${studentId}`, {
          method: "DELETE",
        }),
      );
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout
      user={user}
      onLogout={logout}
      title={group?.name ?? "Группа"}
      subtitle={
        group
          ? `${
              group.teacher
                ? `Преподаватель: ${group.teacher.full_name ?? group.teacher.email}`
                : "Преподаватель не назначен"
            } · ${group.students.length} студентов`
          : undefined
      }
    >
        <Link
          to="/groups"
          className="inline-block text-sm text-muted transition-colors duration-150 hover:text-ink"
        >
          ← Группы
        </Link>

        {group && (
          <>
            {error && <ErrorText>{error}</ErrorText>}

            <Card title="Настройки">
              <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
                <Input
                  type="text"
                  name="name"
                  defaultValue={group.name}
                  placeholder="Название"
                  className="w-48"
                  required
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
                  onClick={() => void handleDeleteGroup()}
                  className="ml-auto text-sm text-muted transition-colors duration-150 hover:text-red-600"
                >
                  Удалить группу
                </button>
              </form>
            </Card>

            <Card title={`Студенты · ${group.students.length}`} flush>
              <form
                onSubmit={handleAddStudent}
                className="flex flex-wrap items-center gap-2 border-b border-line px-5 pb-5"
              >
                <Select name="email" disabled={available.length === 0}>
                  {available.length === 0 && (
                    <option value="">Нет свободных студентов</option>
                  )}
                  {available.map((student) => (
                    <option key={student.id} value={student.email}>
                      {student.full_name ? `${student.full_name} — ` : ""}
                      {student.email}
                    </option>
                  ))}
                </Select>
                <Button type="submit" disabled={loading || available.length === 0}>
                  {loading ? "Добавление…" : "Добавить"}
                </Button>
              </form>

              {group.students.length === 0 ? (
                <Empty>В группе пока нет студентов</Empty>
              ) : (
                <ul className="divide-y divide-line">
                  {group.students.map((student) => (
                    <li
                      key={student.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
                    >
                      <span className="w-56 truncate text-sm text-ink">
                        {student.full_name ?? student.email}
                      </span>
                      <span className="flex-1 truncate text-sm text-muted">
                        {student.full_name ? student.email : "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleRemoveStudent(student.id, student.email)
                        }
                        className="text-sm text-muted transition-colors duration-150 hover:text-red-600"
                      >
                        Убрать
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}

        {!group && error && <ErrorText>{error}</ErrorText>}
    </Layout>
  );
}
