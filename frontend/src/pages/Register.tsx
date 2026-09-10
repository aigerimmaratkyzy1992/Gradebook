import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import { Button } from "../components/Button";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { LinkButton } from "../components/LinkButton";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("passwordConfirm"))) {
      setError("Пароли не совпадают");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { access_token } = await api<{ access_token: string }>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify({ email: form.get("email"), password }),
        },
      );
      setToken(access_token);
      navigate("/");
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-3">
        <Input
          className="w-full"
          type="email"
          name="email"
          placeholder="Почта"
          autoComplete="email"
          required
        />
        <Input
          className="w-full"
          type="password"
          name="password"
          placeholder="Пароль"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Input
          className="w-full"
          type="password"
          name="passwordConfirm"
          placeholder="Повторите пароль"
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Регистрация…" : "Зарегистрироваться"}
        </Button>
        <LinkButton className="w-full" to="/login">Войти</LinkButton>
      </form>
    </main>
  );
}
