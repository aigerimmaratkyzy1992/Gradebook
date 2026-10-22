import { ListPlus } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";

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
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ROUTES } from "@/constants/routes";
import { api, getErrorMessage } from "@/lib/api";
import type { ITestBrief } from "@/types";

interface IAddTestDialogProps {
  topicId: number;
}

/** Тақырыпқа тест қосу: атауын сұрап, құрылған тесттің редакторына өтеді. */
export function AddTestDialog({ topicId }: IAddTestDialogProps) {
  const id = useId();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function handleOpenChange(isNextOpen: boolean) {
    setIsOpen(isNextOpen);
    if (!isNextOpen) setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "");

    setError("");
    setIsSaving(true);
    try {
      const test = await api<Pick<ITestBrief, "id">>(`/api/topics/${topicId}/tests`, {
        method: "POST",
        body: JSON.stringify({ title }),
      });
      navigate(ROUTES.testEdit(test.id));
    } catch (caught) {
      setError(getErrorMessage(caught));
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Добавить тест">
          <ListPlus aria-hidden />
          Тест
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый тест</DialogTitle>
          <DialogDescription>
            Вопросы и параметры можно будет настроить на следующем шаге.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Field label="Название теста" htmlFor={`${id}-title`}>
            <Input id={`${id}-title`} name="title" required autoFocus />
          </Field>
          <FormError message={error} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSaving}>
                Отмена
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isSaving}>
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
