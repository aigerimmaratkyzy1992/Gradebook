import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/shared/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/constants/validation";
import { api, getErrorMessage } from "@/lib/api";
import type { IUser } from "@/types";

import { RoleSelect } from "./RoleSelect";

interface IEditUserDialogProps {
  user: IUser;
  /** Admin өз рөлін өзгерте алмайды. */
  isSelf: boolean;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSaved: (user: IUser) => Promise<void>;
}

export function EditUserDialog({
  user,
  isSelf,
  isOpen,
  onOpenChange,
  onSaved,
}: IEditUserDialogProps) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fieldId = (name: string) => `edit-user-${user.id}-${name}`;

  function handleOpenChange(nextIsOpen: boolean) {
    if (!nextIsOpen) setError("");
    onOpenChange(nextIsOpen);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    // Өшірілген select FormData-ға түспейді — өз рөлін жібермейміз.
    const role = data.get("role");

    setError("");
    setIsSaving(true);
    try {
      const updated = await api<IUser>(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          email: data.get("email"),
          full_name: data.get("full_name") || null,
          ...(role ? { role } : {}),
          // Пароль тек толтырылса ғана ауысады.
          ...(password ? { password } : {}),
        }),
      });
      toast.success("Сохранено");
      onOpenChange(false);
      await onSaved(updated);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактирование пользователя</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Почта" htmlFor={fieldId("email")}>
            <Input
              id={fieldId("email")}
              type="email"
              name="email"
              defaultValue={user.email}
              autoComplete="off"
              required
            />
          </Field>
          <Field label="ФИО" htmlFor={fieldId("name")}>
            <Input
              id={fieldId("name")}
              type="text"
              name="full_name"
              defaultValue={user.full_name ?? ""}
              placeholder="Фамилия Имя"
              autoComplete="off"
            />
          </Field>
          {/* Өз паролін мұнда ауыстырса, ағымдағы токен жарамсыз болады —
              ол үшін жаңа токен беретін «Профиль» беті бар. */}
          {!isSelf && (
            <Field
              label="Новый пароль"
              htmlFor={fieldId("password")}
              hint="Оставьте пустым, чтобы не менять"
            >
              <PasswordInput
                id={fieldId("password")}
                name="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
              />
            </Field>
          )}
          <Field
            label="Роль"
            htmlFor={fieldId("role")}
            hint={isSelf ? "Собственную роль изменить нельзя" : undefined}
          >
            <RoleSelect id={fieldId("role")} defaultValue={user.role} disabled={isSelf} />
          </Field>
          <FormError message={error} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isSaving}>
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
