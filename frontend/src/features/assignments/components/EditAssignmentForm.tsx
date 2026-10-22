import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { api, getErrorMessage, uploadAssignmentFiles } from "@/lib/api";
import type { AssignmentDetail } from "@/types";

import { getAssignmentPayload } from "../utils";
import { AssignmentFields } from "./AssignmentFields";
import { AttachedFilesEditor } from "./AttachedFilesEditor";

interface IEditAssignmentFormProps {
  assignment: Pick<
    AssignmentDetail,
    "id" | "title" | "description" | "material_url" | "criteria" | "due_at" | "max_score" | "files"
  >;
  onSaved: () => Promise<void>;
  onCancel: () => void;
  onFilesChanged: () => Promise<void>;
}

export function EditAssignmentForm({
  assignment,
  onSaved,
  onCancel,
  onFilesChanged,
}: IEditAssignmentFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setError("");
    setIsSaving(true);
    try {
      // PATCH қайталанса зиянсыз, сондықтан файл жүктелмесе форманы қайта жіберуге болады.
      await api(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        body: JSON.stringify(getAssignmentPayload(data)),
      });
      await uploadAssignmentFiles(assignment.id, data);
      toast.success("Задание сохранено");
      await onSaved();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Редактирование задания</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <AssignmentFields
            defaults={assignment}
            shouldAutoFocus
            attachedFiles={
              <AttachedFilesEditor files={assignment.files} onChanged={onFilesChanged} />
            }
          />
          <FormError message={error} />
        </CardContent>
        <CardFooter>
          <Button type="submit" isLoading={isSaving}>
            Сохранить
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            Отмена
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
