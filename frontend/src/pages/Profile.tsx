import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorText } from "../components/ErrorText";
import { Layout } from "../components/Layout";
import { Input } from "../components/Input";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import { useSession } from "../lib/session";
import { ROLE_LABELS, type User } from "../lib/types";

export default function Profile() {
  const { user, logout } = useSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => setProfile(user), [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = String(new FormData(event.currentTarget).get("full_name"));

    setError("");
    setSaved(false);
    setLoading(true);
    try {
      setProfile(
        await api<User>("/api/users/me", {
          method: "PATCH",
          body: JSON.stringify({ full_name: fullName }),
        }),
      );
      setSaved(true);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setPasswordError("");
    setPasswordSaved(false);
    try {
      // Пароль ауысқанда ескі токен жарамсыз болады — жаңасын сақтаймыз.
      const { access_token } = await api<{ access_token: string }>(
        "/api/users/me/password",
        {
          method: "POST",
          body: JSON.stringify({
            current_password: data.get("current_password"),
            new_password: data.get("new_password"),
          }),
        },
      );
      setToken(access_token);
      form.reset();
      setPasswordSaved(true);
    } catch (caught) {
      setPasswordError((caught as Error).message);
    }
  }

  return (
    <Layout
      user={profile}
      onLogout={logout}
      title="Профиль"
      subtitle="Личные данные"
    >
      {profile && (
        <Card title={`${profile.email} · ${ROLE_LABELS[profile.role]}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label htmlFor="full_name" className="block text-sm text-muted">
                Фамилия, имя, отчество
              </label>
              <Input
                id="full_name"
                type="text"
                name="full_name"
                defaultValue={profile.full_name ?? ""}
                placeholder="Иванов Иван Иванович"
                autoComplete="name"
                maxLength={255}
                className="w-full"
              />
              {error && <ErrorText>{error}</ErrorText>}
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                  {loading ? "Сохранение…" : "Сохранить"}
                </Button>
                {saved && !error && (
                  <span className="text-sm text-muted transition-opacity duration-200 starting:opacity-0">
                    Сохранено
                  </span>
                )}
              </div>
            </form>
          </Card>
        )}

      {profile && (
        <Card title="Смена пароля">
          <form onSubmit={handlePassword} className="space-y-3">
            <p className="text-sm text-muted">
              Если пароль сбросил администратор, введите выданный стандартный пароль
              и задайте свой.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="password"
                name="current_password"
                placeholder="Текущий пароль"
                autoComplete="current-password"
                className="w-56"
                required
              />
              <Input
                type="password"
                name="new_password"
                placeholder="Новый пароль"
                autoComplete="new-password"
                className="w-56"
                minLength={8}
                required
              />
            </div>
            {passwordError && <ErrorText>{passwordError}</ErrorText>}
            <div className="flex items-center gap-3">
              <Button type="submit">Изменить пароль</Button>
              {passwordSaved && !passwordError && (
                <span className="text-sm text-muted transition-opacity duration-200 starting:opacity-0">
                  Пароль изменён
                </span>
              )}
            </div>
          </form>
        </Card>
      )}
    </Layout>
  );
}
