import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { api, getErrorMessage } from "@/lib/api";
import { useSession } from "@/providers/SessionProvider";
import type { ITokenResponse } from "@/types";

import { PasswordInput } from "@/components/shared/PasswordInput";
import { PASSWORD_MIN_LENGTH, PASSWORD_MISMATCH_MESSAGE } from "@/constants/validation";

export default function Register() {
  const { signIn } = useSession();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password !== String(form.get("passwordConfirm"))) {
      setError(PASSWORD_MISMATCH_MESSAGE);
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      // Тіркелген соң сервер бірден токен береді — қайта кірудің қажеті жоқ.
      const { access_token } = await api<ITokenResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password }),
      });
      // Редиректті GuestOnly жасайды.
      await signIn(access_token);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Регистрация"
      description="Создайте аккаунт студента"
      footer={
        <>
          Уже есть аккаунт?{" "}
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
        <Field label="Пароль" htmlFor="password" hint={`Не менее ${PASSWORD_MIN_LENGTH} символов`}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
        </Field>
        <Field label="Повторите пароль" htmlFor="passwordConfirm">
          <PasswordInput
            id="passwordConfirm"
            name="passwordConfirm"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
        </Field>
        <FormError message={error} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Зарегистрироваться
        </Button>
      </form>
    </AuthLayout>
  );
}
