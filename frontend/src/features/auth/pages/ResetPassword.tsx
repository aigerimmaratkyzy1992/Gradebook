import { CircleCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { api, getErrorMessage } from "@/lib/api";

import { PasswordInput } from "@/components/shared/PasswordInput";
import { PASSWORD_MIN_LENGTH, PASSWORD_MISMATCH_MESSAGE } from "@/constants/validation";

const CODE_LENGTH = 6;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [error, setError] = useState("");
  const [isDone, setIsDone] = useState(false);
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
      await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, code: form.get("code"), password }),
      });
      setIsDone(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <AuthLayout title="Пароль обновлён" description="Теперь можно войти с новым паролем">
        <div className="space-y-5">
          <span className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleCheck className="size-5" aria-hidden />
          </span>
          <Button asChild className="w-full">
            <Link to={ROUTES.login}>Войти</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Новый пароль"
      description={email ? `Код отправлен на ${email}` : "Введите код из письма"}
      footer={
        <Link
          to={ROUTES.forgotPassword}
          className="font-medium text-foreground hover:underline"
        >
          Отправить код заново
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Код из письма" htmlFor="code">
          <Input
            id="code"
            type="text"
            name="code"
            placeholder="000000"
            inputMode="numeric"
            pattern={`[0-9]{${CODE_LENGTH}}`}
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            className="font-mono tracking-[0.3em]"
            required
            autoFocus
          />
        </Field>
        <Field
          label="Новый пароль"
          htmlFor="password"
          hint={`Не менее ${PASSWORD_MIN_LENGTH} символов`}
        >
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
          Сохранить пароль
        </Button>
      </form>
    </AuthLayout>
  );
}
