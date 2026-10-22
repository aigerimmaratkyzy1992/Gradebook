import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { api, getErrorMessage } from "@/lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));

    setError("");
    setIsSubmitting(true);
    try {
      await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      navigate(`${ROUTES.resetPassword}?${new URLSearchParams({ email })}`);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Восстановление пароля"
      description="Отправим шестизначный код на вашу почту"
      footer={
        <>
          Вспомнили пароль?{" "}
          <Link to={ROUTES.login} className="font-medium text-foreground hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Почта" htmlFor="email">
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="name@example.com"
            autoComplete="email"
            required
            autoFocus
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Отправить код
        </Button>
      </form>
    </AuthLayout>
  );
}
