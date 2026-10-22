import { Check, Undo2 } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { FormError } from "@/components/shared/FormError";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { api, getErrorMessage } from "@/lib/api";
import type { ISubmission } from "@/types";

type ReviewAction = "accept" | "send_back";

interface IReviewFormProps {
  submission: Pick<ISubmission, "id" | "score" | "comment">;
  maxScore: number;
  onReviewed: () => Promise<void>;
}

/** Балл мен пікір қою: «Проверено» немесе «На доработку». */
export function ReviewForm({ submission, maxScore, onReviewed }: IReviewFormProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [pendingAction, setPendingAction] = useState<ReviewAction | null>(null);
  const [error, setError] = useState("");

  async function submitReview(action: ReviewAction) {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const score = String(data.get("score") ?? "");
    const shouldSendBack = action === "send_back";

    setError("");
    setPendingAction(action);
    try {
      await api(`/api/assignments/submissions/${submission.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          score: score === "" ? null : Number(score),
          comment: data.get("comment") || null,
          send_back: shouldSendBack,
        }),
      });
      toast.success(shouldSendBack ? "Работа отправлена на доработку" : "Работа проверена");
      await onReviewed();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPendingAction(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitReview("accept");
  }

  const isPending = pendingAction !== null;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <Field label="Комментарий студенту" htmlFor={`${id}-comment`}>
        <Textarea
          id={`${id}-comment`}
          name="comment"
          rows={3}
          defaultValue={submission.comment ?? ""}
        />
      </Field>
      <Field label={`Балл (из ${maxScore})`} htmlFor={`${id}-score`}>
        <Input
          id={`${id}-score`}
          type="number"
          name="score"
          min={0}
          max={maxScore}
          defaultValue={submission.score ?? ""}
          className="w-32"
        />
      </Field>
      <FormError message={error} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" isLoading={pendingAction === "accept"} disabled={isPending}>
          {pendingAction !== "accept" && <Check aria-hidden />}
          Проверено
        </Button>
        {/* type="button": доработкаға қайтарғанда балл өрісінің валидациясы керек емес. */}
        <Button
          type="button"
          variant="outline"
          isLoading={pendingAction === "send_back"}
          disabled={isPending}
          onClick={() => void submitReview("send_back")}
          className="hover:border-destructive/40 hover:text-destructive"
        >
          {pendingAction !== "send_back" && <Undo2 aria-hidden />}
          На доработку
        </Button>
      </div>
    </form>
  );
}
