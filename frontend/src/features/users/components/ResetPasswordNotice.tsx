import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";

import type { IPasswordReset } from "../types";

interface IResetPasswordNoticeProps {
  reset: IPasswordReset;
  onDismiss: () => void;
}

/** Сброс нәтижесі: стандартты парольді admin пайдаланушыға өзі береді. */
export function ResetPasswordNotice({ reset, onDismiss }: IResetPasswordNoticeProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reset.password);
      toast.success("Пароль скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  }

  return (
    <Card
      role="status"
      className="flex flex-col gap-4 p-5 transition-opacity duration-200 starting:opacity-0 sm:flex-row sm:items-start"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
        <KeyRound className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm">
          Пароль пользователя <span className="font-medium">{reset.email}</span> сброшен.
        </p>
        <div className="flex items-center gap-2">
          <code className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-sm font-semibold">
            {reset.password}
          </code>
          <Tooltip content="Скопировать">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Скопировать пароль"
              onClick={() => void handleCopy()}
            >
              <Copy />
            </Button>
          </Tooltip>
        </div>
        <p className="text-sm text-muted-foreground">
          Передайте его пользователю — он сможет войти и сменить пароль в профиле.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onDismiss} className="self-start">
        Скрыть
      </Button>
    </Card>
  );
}
