import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/shared/ConfirmAction";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { ROLE_LABELS } from "@/constants/labels";
import { FADE_ITEM_MOTION } from "@/constants/motion";
import { api } from "@/lib/api";
import { getDisplayName, getInitials } from "@/lib/utils";
import type { IUser } from "@/types";

import { ROLE_BADGE_VARIANTS } from "../constants";
import type { IPasswordReset } from "../types";

import { EditUserDialog } from "./EditUserDialog";

interface IUserRowProps {
  user: IUser;
  /** Admin өзін өшіре де, өз паролін сброс та жасай алмайды. */
  isSelf: boolean;
  onSaved: (user: IUser) => Promise<void>;
  onDeleted: () => Promise<void>;
  onPasswordReset: (reset: IPasswordReset) => void;
}

export function UserRow({ user, isSelf, onSaved, onDeleted, onPasswordReset }: IUserRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  async function handleResetPassword() {
    const { password } = await api<{ password: string }>(
      `/api/users/${user.id}/reset-password`,
      { method: "POST" },
    );
    onPasswordReset({ email: user.email, password });
  }

  async function handleDelete() {
    await api(`/api/users/${user.id}`, { method: "DELETE" });
    toast.success("Пользователь удалён");
    await onDeleted();
  }

  return (
    <motion.li
      layout="position"
      {...FADE_ITEM_MOTION}
      className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-accent/50"
    >
      <span
        aria-hidden
        className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground sm:flex"
      >
        {getInitials(user.full_name, user.email)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="truncate">{getDisplayName(user)}</span>
          {isSelf && <span className="shrink-0 text-xs text-muted-foreground">(вы)</span>}
        </p>
        {user.full_name && (
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        )}
      </div>

      <Badge variant={ROLE_BADGE_VARIANTS[user.role]} className="hidden sm:inline-flex">
        {ROLE_LABELS[user.role]}
      </Badge>

      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip content="Изменить">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Изменить ${user.email}`}
            onClick={() => setIsEditing(true)}
          >
            <Pencil />
          </Button>
        </Tooltip>

        {!isSelf && (
          <>
            <ConfirmAction
              title="Сбросить пароль?"
              description={`Пароль пользователя ${user.email} будет заменён на стандартный.`}
              confirmLabel="Сбросить"
              onConfirm={handleResetPassword}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Сбросить пароль ${user.email}`}
                title="Сбросить пароль"
              >
                <KeyRound />
              </Button>
            </ConfirmAction>

            <ConfirmAction
              title="Удалить пользователя?"
              description={`Аккаунт ${user.email} будет удалён без возможности восстановления.`}
              onConfirm={handleDelete}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Удалить ${user.email}`}
                title="Удалить"
                className="hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </ConfirmAction>
          </>
        )}
      </div>

      <EditUserDialog
        user={user}
        isSelf={isSelf}
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        onSaved={onSaved}
      />
    </motion.li>
  );
}
