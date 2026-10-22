import { useState, type FormEvent } from "react";
import { Link } from "react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ROUTES } from "@/constants/routes";
import { api, getErrorMessage } from "@/lib/api";
import { useSession } from "@/providers/SessionProvider";
import type { ITokenResponse } from "@/types";

import { PasswordInput } from "@/components/shared/PasswordInput";


export default function Login() {
  const { signIn } = useSession();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setError("");
    setIsSubmitting(true);
    try {
      const { access_token } = await api<ITokenResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      // Редиректті GuestOnly жасайды (бастапқы бетке қайтарады).
      await signIn(access_token);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Вход"
      description="Войдите, чтобы продолжить работу"
      footer={
        <>
          Нет аккаунта?{" "}
          <Link to={ROUTES.register} className="font-medium text-foreground hover:underline">
            Регистрация
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
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Link
              to={ROUTES.forgotPassword}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Забыли пароль?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Войти
        </Button>
      </form>
    </AuthLayout>
  );
}
