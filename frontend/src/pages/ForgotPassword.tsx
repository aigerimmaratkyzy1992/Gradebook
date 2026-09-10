import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

import { Button } from "../components/Button";
import { ErrorText } from "../components/ErrorText";
import { Input } from "../components/Input";
import { LinkButton } from "../components/LinkButton";
import { api } from "../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));

    setError("");
    setLoading(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
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
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Отправка…" : "Отправить код"}
        </Button>
        <LinkButton className="w-full" to="/login">Войти</LinkButton>
      </form>
    </main>
  );
}
