import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "../components/Button";
import { Card, Empty } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { Select } from "../components/Select";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import { ROLE_LABELS, type Role, type User } from "../lib/types";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export default function Users() {
  const { user, logout } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [reset, setReset] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setUsers(await api<User[]>("/api/users"));
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setError("");
    setLoading(true);
    try {
      await api("/api/users", {
        method: "POST",
        body: JSON.stringify({
          email: data.get("email"),
          full_name: data.get("full_name") || null,
          password: data.get("password"),
          role: data.get("role"),
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
    const password = String(data.get("password") ?? "");

    setError("");
    try {
      await api(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          email: data.get("email"),
          full_name: data.get("full_name") || null,
          role: data.get("role"),
          // Пароль тек толтырылса ғана ауысады.
          ...(password ? { password } : {}),
        }),
      });
      setEditing(null);
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleResetPassword(id: number, email: string) {
    if (!confirm(`Сбросить пароль пользователя ${email} на стандартный?`)) return;

    setError("");
    try {
      const result = await api<{ password: string }>(
        `/api/users/${id}/reset-password`,
        { method: "POST" },
      );
      setReset({ email, password: result.password });
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  async function handleDelete(id: number, email: string) {
    if (!confirm(`Удалить пользователя ${email}?`)) return;

    setError("");
    try {
      await api(`/api/users/${id}`, { method: "DELETE" });
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }

  return (
    <Layout user={user} onLogout={logout} title="Пользователи">
      <Card title="Новый пользователь">
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            name="email"
            placeholder="Почта"
            autoComplete="off"
            className="w-52"
            required
          />
          <Input
            type="text"
            name="full_name"
            placeholder="Фамилия Имя"
            className="w-44"
          />
          <Input
            type="password"
            name="password"
            placeholder="Пароль"
            autoComplete="new-password"
            className="w-36"
            minLength={8}
            required
          />
          <Select name="role" defaultValue="student">
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={loading}>
            {loading ? "Добавление…" : "Добавить"}
          </Button>
        </form>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}

      {reset && (
        <div className="rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-sm text-ink">
            Пароль пользователя <span className="font-medium">{reset.email}</span>{" "}
            сброшен. Стандартный пароль:{" "}
            <span className="font-bold">{reset.password}</span>
          </p>
          <p className="mt-1 text-sm text-muted">
            Передайте его пользователю — он сможет войти и сменить пароль в профиле.
          </p>
          <button
            type="button"
            onClick={() => setReset(null)}
            className="mt-2 text-sm text-muted transition-colors duration-150 hover:text-ink"
          >
            Скрыть
          </button>
        </div>
      )}

      <Card title={`Все пользователи · ${users.length}`} flush>
        {users.length === 0 ? (
          <Empty>Пока нет пользователей</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {users.map((item) =>
              editing === item.id ? (
                <li key={item.id} className="px-5 py-3.5">
                  <form
                    onSubmit={(event) => void handleUpdate(event, item.id)}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      type="email"
                      name="email"
                      defaultValue={item.email}
                      placeholder="Почта"
                      autoComplete="off"
                      className="w-52"
                      required
                      autoFocus
                    />
                    <Input
                      type="text"
                      name="full_name"
                      defaultValue={item.full_name ?? ""}
                      placeholder="Фамилия Имя"
                      className="w-44"
                    />
                    <Input
                      type="password"
                      name="password"
                      placeholder="Новый пароль"
                      autoComplete="new-password"
                      className="w-40"
                      minLength={8}
                    />
                    <Select
                      name="role"
                      defaultValue={item.role}
                      disabled={item.id === user?.id}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
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
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-canvas"
                >
                  <span className="w-52 truncate text-sm font-medium text-ink">
                    {item.full_name ?? item.email}
                  </span>
                  <span className="flex-1 truncate text-sm text-muted">
                    {item.full_name ? item.email : "—"}
                  </span>
                  <span className="w-36 text-sm text-muted">
                    {ROLE_LABELS[item.role]}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(item.id)}
                    className="text-sm text-muted transition-colors duration-150 hover:text-ink"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleResetPassword(item.id, item.email)}
                    disabled={item.id === user?.id}
                    className="text-sm text-muted transition-colors duration-150 hover:text-ink disabled:opacity-40 disabled:hover:text-muted"
                  >
                    Сбросить пароль
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item.id, item.email)}
                    disabled={item.id === user?.id}
                    className="text-sm text-muted transition-colors duration-150 hover:text-red-600 disabled:opacity-40 disabled:hover:text-muted"
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
