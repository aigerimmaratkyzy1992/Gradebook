import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ROLE_LABELS } from "@/constants/labels";
import { FULL_NAME_MAX_LENGTH } from "@/constants/validation";
import { api, getErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { getDisplayName, getInitials } from "@/lib/utils";
import { useCurrentUser, useSession } from "@/providers/SessionProvider";
import type { IUser } from "@/types";

/** Профиль карточкасы: аватар, пошта, рөл және ФИО өңдеу формасы. */
export function ProfileForm() {
  const user = useCurrentUser();
  const { setUser } = useSession();
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = String(new FormData(event.currentTarget).get("full_name"));

    setError("");
    setIsSaving(true);
    try {
      const updated = await api<IUser>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName }),
      });
      // Header-дегі аватар мен аты бірден жаңарсын.
      setUser(updated);
      toast.success("Сохранено");
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="items-center justify-start gap-4">
        <span
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground"
        >
          {getInitials(user.full_name, user.email)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{getDisplayName(user)}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            В системе с {formatDate(user.created_at)}
          </p>
        </div>
        <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 border-t border-border pt-5">
          <Field
            label="Фамилия, имя, отчество"
            htmlFor="full_name"
            hint="Отображается преподавателям и в журнале"
          >
            <Input
              id="full_name"
              type="text"
              name="full_name"
              defaultValue={user.full_name ?? ""}
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
              maxLength={FULL_NAME_MAX_LENGTH}
            />
          </Field>
          <FormError message={error} />
          <Button type="submit" isLoading={isSaving}>
            Сохранить
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
