import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/constants/validation";
import { api, getErrorMessage } from "@/lib/api";
import { useSession } from "@/providers/SessionProvider";
import type { ITokenResponse } from "@/types";

export function PasswordForm() {
  const { replaceToken } = useSession();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setError("");
    setIsSaving(true);
    try {
      // Пароль ауысқанда ескі токен жарамсыз болады — жаңасын сақтаймыз.
      const { access_token } = await api<ITokenResponse>("/api/users/me/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: data.get("current_password"),
          new_password: data.get("new_password"),
        }),
      });
      replaceToken(access_token);
      form.reset();
      toast.success("Пароль изменён");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Смена пароля</CardTitle>
          <CardDescription>
            Если пароль сбросил администратор, введите выданный стандартный пароль и
            задайте свой.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Текущий пароль" htmlFor="current_password">
              <PasswordInput
                id="current_password"
                name="current_password"
                autoComplete="current-password"
                required
              />
            </Field>
            <Field
              label="Новый пароль"
              htmlFor="new_password"
              hint={`Не менее ${PASSWORD_MIN_LENGTH} символов`}
            >
              <PasswordInput
                id="new_password"
                name="new_password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
            </Field>
          </div>
          <FormError message={error} />
          <Button type="submit" isLoading={isSaving}>
            Изменить пароль
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
