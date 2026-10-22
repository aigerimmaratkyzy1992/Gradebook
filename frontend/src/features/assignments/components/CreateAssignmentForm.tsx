import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { api, getErrorMessage, uploadAssignmentFiles } from "@/lib/api";
import type { IAssignment } from "@/types";

import { getAssignmentPayload } from "../utils";
import { AssignmentFields } from "./AssignmentFields";

interface ICreateAssignmentFormProps {
  topicId: number;
  onCreated: () => Promise<void>;
  onCancel: () => void;
}

/** Тақырыпқа жаңа тапсырма: өрістер + материал файлдары. Дисциплина бетінде ашылады. */
export function CreateAssignmentForm({
  topicId,
  onCreated,
  onCancel,
}: ICreateAssignmentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    setIsSaving(true);
    let created: Pick<IAssignment, "id">;
    try {
      created = await api<Pick<IAssignment, "id">>(`/api/topics/${topicId}/assignments`, {
        method: "POST",
        body: JSON.stringify(getAssignmentPayload(data)),
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
      setIsSaving(false);
      return;
    }

    try {
      await uploadAssignmentFiles(created.id, data);
      toast.success("Задание создано");
    } catch (caught) {
      // Тапсырма құрылып қойған: форманы қайта жіберсе, көшірмесі пайда болар еді.
      // Сондықтан форманы жабамыз, файлдарды тапсырма бетінде қайта тіркеуге болады.
      toast.error("Задание создано, но файлы не загрузились", {
        description: getErrorMessage(caught),
      });
    }
    setIsSaving(false);
    await onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-t border-border bg-muted/40 px-5 py-4"
      aria-label="Новое задание"
    >
      <p className="text-sm font-medium">Новое задание</p>
      <AssignmentFields shouldAutoFocus />
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={isSaving}>
          Создать задание
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
