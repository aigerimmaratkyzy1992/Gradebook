import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/api";

interface IConfirmActionProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void>;
  /** Триггер — бір түйме (мыс. <Button variant="ghost">). */
  children: ReactNode;
}

/**
 * Қайтымсыз әрекетті (өшіру) растау терезесі. window.confirm-нің орнына:
 * тақырыпқа сай, пернетақтамен басқарылады, қатені toast-пен көрсетеді.
 */
export function ConfirmAction({
  title,
  description,
  confirmLabel = "Удалить",
  onConfirm,
  children,
}: IConfirmActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  async function handleConfirm() {
    setIsPending(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (caught) {
      toast.error(getErrorMessage(caught));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
          <Button
            variant="destructive"
            isLoading={isPending}
            onClick={() => void handleConfirm()}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
