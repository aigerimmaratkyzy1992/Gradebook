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
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/constants/validation";
import { api, getErrorMessage } from "@/lib/api";

import { RoleSelect } from "./RoleSelect";

interface ICreateUserFormProps {
  onCreated: () => Promise<void>;
}

export function CreateUserForm({ onCreated }: ICreateUserFormProps) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setError("");
    setIsSaving(true);
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
      toast.success("Пользователь добавлен");
      await onCreated();
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
          <CardTitle>Новый пользователь</CardTitle>
          <CardDescription>
            Аккаунты преподавателей и студентов создаются только здесь
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Почта" htmlFor="new-user-email">
              <Input
                id="new-user-email"
                type="email"
                name="email"
                placeholder="name@example.com"
                autoComplete="off"
                required
              />
            </Field>
            <Field label="ФИО" htmlFor="new-user-name">
              <Input
                id="new-user-name"
                type="text"
                name="full_name"
                placeholder="Фамилия Имя"
                autoComplete="off"
              />
            </Field>
            <Field label="Пароль" htmlFor="new-user-password">
              <PasswordInput
                id="new-user-password"
                name="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                required
              />
            </Field>
            <Field label="Роль" htmlFor="new-user-role">
              <RoleSelect id="new-user-role" defaultValue="student" />
            </Field>
          </div>
          <FormError message={error} />
          <Button type="submit" isLoading={isSaving}>
            Добавить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
